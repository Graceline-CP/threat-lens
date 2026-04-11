import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import easyocr
import io
import re
import numpy as np

# Initialize EasyOCR
reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())

# Load MobileNetV3 for image classification
mobilenet = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
mobilenet.eval()

# ImageNet transform
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

SUSPICIOUS_OCR_PATTERNS = [
    (r'\b(verify|confirm|update)\s+(your\s+)?(account|password|details)\b', "Account verification demand", 30),
    (r'\b(click|tap|visit|go to)\s+(here|below|link|url)\b', "Suspicious call-to-action", 20),
    (r'\b(urgent|immediately|expires?|deadline)\b', "Urgency language", 15),
    (r'\b(bank|paypal|amazon|apple|microsoft|google)\b', "Brand impersonation", 20),
    (r'\b(password|ssn|social security|credit card|cvv)\b', "Sensitive data request", 35),
    (r'https?://[^\s]+', "URL present in image", 10),
    (r'\b(won|prize|lottery|selected|congratulations)\b', "Prize/lottery language", 25),
    (r'\$\d+|\d+\s*dollars?', "Monetary mention", 10),
]

async def analyze_image(image_bytes: bytes, filename: str) -> dict:
    risk_score = 0
    detected_issues = []
    red_flags = []

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    except Exception:
        return {"error": "Could not open image file"}

    # --- OCR Analysis ---
    try:
        img_array = np.array(image)
        ocr_results = reader.readtext(img_array)
        extracted_text = " ".join([res[1] for res in ocr_results])

        if extracted_text.strip():
            detected_issues.append(f"Extracted text from image ({len(extracted_text)} chars)")

            for pattern, issue_name, weight in SUSPICIOUS_OCR_PATTERNS:
                if re.search(pattern, extracted_text, re.IGNORECASE):
                    risk_score += weight
                    detected_issues.append(f"OCR: {issue_name}")
                    if weight >= 20:
                        red_flags.append({
                            "flag": f"OCR: {issue_name}",
                            "explanation": f"Suspicious text found in image: matches pattern for {issue_name.lower()}."
                        })
        else:
            detected_issues.append("No readable text found in image")

    except Exception as e:
        detected_issues.append(f"OCR error: {str(e)}")
        extracted_text = ""

    # --- Computer Vision Analysis ---
    try:
        tensor = transform(image).unsqueeze(0)
        with torch.no_grad():
            output = mobilenet(tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            top5_prob, top5_catid = torch.topk(probabilities, 5)

        # Check for screenshot-like characteristics
        width, height = image.size
        aspect_ratio = width / height

        if 1.5 <= aspect_ratio <= 2.0 or 0.4 <= aspect_ratio <= 0.7:
            detected_issues.append("Image appears to be a screenshot (common in phishing)")
            risk_score += 10

        # Low entropy could indicate synthetic/generated image
        img_gray = np.array(image.convert('L'))
        entropy = float(-np.sum((np.bincount(img_gray.flatten(), minlength=256) / img_gray.size) *
                                np.log2((np.bincount(img_gray.flatten(), minlength=256) / img_gray.size) + 1e-10)))
        if entropy < 4.0:
            detected_issues.append("Low image complexity - possibly synthetic or heavily edited")
            risk_score += 15
            red_flags.append({
                "flag": "Potentially Synthetic Image",
                "explanation": "Low visual entropy suggests this may be a computer-generated or heavily manipulated image."
            })

    except Exception as e:
        detected_issues.append(f"CV analysis error: {str(e)}")

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        classification = "High Risk"
    elif risk_score >= 35:
        classification = "Suspicious"
    else:
        classification = "Safe"

    return {
        "analysis_type": "image",
        "input": filename,
        "risk_score": risk_score,
        "classification": classification,
        "detected_issues": detected_issues,
        "red_flags": red_flags,
        "extracted_text": extracted_text[:500] if extracted_text else None
    }
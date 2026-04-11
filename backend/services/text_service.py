from transformers import pipeline
import re

# Load DistilBERT-based sentiment/classification pipeline
# Using a zero-shot classification model for flexibility
classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

PHISHING_LABELS = ["phishing", "scam", "safe", "spam", "malicious"]

SCAM_PATTERNS = [
    (r'\b(urgent|immediately|act now|limited time)\b', "Urgency language", 15),
    (r'\b(won|winner|prize|lottery|selected)\b', "Lottery/prize scam language", 20),
    (r'\b(verify your account|confirm your details|update your information)\b', "Account verification request", 25),
    (r'\b(click here|click below|follow this link)\b', "Suspicious link prompt", 10),
    (r'\b(bank|wire transfer|western union|gift card)\b', "Financial transaction request", 20),
    (r'\b(password|social security|ssn|credit card)\b', "Sensitive data request", 30),
    (r'\b(free|no cost|you have been selected)\b', "Too-good-to-be-true offer", 10),
    (r'[A-Z]{5,}', "Excessive capitalization", 5),
    (r'[!]{2,}', "Multiple exclamation marks", 5),
    (r'\$\d+|\d+ dollars', "Monetary amount mentioned", 10),
]

async def analyze_text(text: str) -> dict:
    risk_score = 0
    detected_issues = []
    red_flags = []

    # Pattern-based detection
    for pattern, issue_name, weight in SCAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            risk_score += weight
            detected_issues.append(issue_name)
            if weight >= 20:
                red_flags.append({
                    "flag": issue_name,
                    "explanation": f"Pattern detected: '{pattern}' — commonly used in phishing/scam messages."
                })

    # ML-based classification
    try:
        result = classifier(text[:512], candidate_labels=PHISHING_LABELS)
        top_label = result['labels'][0]
        top_score = result['scores'][0]

        if top_label in ["phishing", "scam", "malicious"] and top_score > 0.5:
            ml_risk = int(top_score * 50)
            risk_score += ml_risk
            red_flags.append({
                "flag": f"AI Classified as {top_label.title()}",
                "explanation": f"NLP model detected {top_label} patterns with {top_score:.0%} confidence."
            })
            detected_issues.append(f"AI model classification: {top_label} ({top_score:.0%} confidence)")
        elif top_label == "spam" and top_score > 0.6:
            risk_score += 15
            detected_issues.append(f"Possible spam content ({top_score:.0%} confidence)")

    except Exception as e:
        detected_issues.append(f"ML analysis unavailable: {str(e)}")

    # Text statistics
    word_count = len(text.split())
    if word_count < 10:
        detected_issues.append("Very short text — limited analysis possible")

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        classification = "High Risk"
    elif risk_score >= 35:
        classification = "Suspicious"
    else:
        classification = "Safe"

    return {
        "analysis_type": "text",
        "input": text[:200] + "..." if len(text) > 200 else text,
        "risk_score": risk_score,
        "classification": classification,
        "detected_issues": detected_issues,
        "red_flags": red_flags,
        "word_count": word_count
    }
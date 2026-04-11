import requests
import whois
from bs4 import BeautifulSoup
import sqlite3
import re
from urllib.parse import urlparse
import json

PHISHTANK_DB = "phishtank_urls.db"  # Pre-downloaded PhishTank dataset

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "update", "secure", "account", "banking",
    "password", "confirm", "paypal", "amazon", "apple", "google",
    "microsoft", "urgent", "suspended", "limited"
]

def check_phishtank(url: str) -> bool:
    """Check URL against local PhishTank dataset."""
    try:
        conn = sqlite3.connect(PHISHTANK_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM phish_urls WHERE url = ?", (url,))
        result = cursor.fetchone()
        conn.close()
        return result is not None
    except Exception:
        return False

def extract_url_features(url: str) -> dict:
    parsed = urlparse(url)
    domain = parsed.netloc
    path = parsed.path

    features = {
        "has_ip": bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain)),
        "url_length": len(url),
        "num_subdomains": domain.count('.'),
        "has_at_symbol": '@' in url,
        "has_double_slash": '//' in path,
        "uses_https": parsed.scheme == 'https',
        "suspicious_keywords": [kw for kw in SUSPICIOUS_KEYWORDS if kw in url.lower()],
        "domain": domain,
    }
    return features

async def analyze_url(url: str) -> dict:
    risk_score = 0
    detected_issues = []
    red_flags = []

    # Check PhishTank
    if check_phishtank(url):
        risk_score += 80
        red_flags.append({"flag": "Known Phishing URL", "explanation": "This URL appears in the PhishTank database of confirmed phishing sites."})
        detected_issues.append("Listed in PhishTank phishing database")

    features = extract_url_features(url)

    if features["has_ip"]:
        risk_score += 30
        red_flags.append({"flag": "IP Address as Host", "explanation": "Legitimate sites use domain names, not raw IP addresses."})
        detected_issues.append("Uses raw IP address instead of domain name")

    if features["url_length"] > 75:
        risk_score += 15
        detected_issues.append(f"Unusually long URL ({features['url_length']} chars)")

    if features["has_at_symbol"]:
        risk_score += 25
        red_flags.append({"flag": "@ Symbol in URL", "explanation": "The @ symbol tricks browsers into ignoring everything before it."})
        detected_issues.append("Contains @ symbol - classic phishing trick")

    if features["num_subdomains"] > 3:
        risk_score += 20
        detected_issues.append("Excessive subdomains - possible domain spoofing")

    if features["suspicious_keywords"]:
        risk_score += len(features["suspicious_keywords"]) * 10
        red_flags.append({
            "flag": "Sensitive Keywords Detected",
            "explanation": f"URL contains phishing-related keywords: {', '.join(features['suspicious_keywords'])}"
        })
        detected_issues.append(f"Contains suspicious keywords: {', '.join(features['suspicious_keywords'])}")

    if not features["uses_https"]:
        risk_score += 15
        detected_issues.append("Not using HTTPS - data may be intercepted")

    # WHOIS lookup
    try:
        w = whois.whois(features["domain"])
        if w.creation_date:
            from datetime import datetime
            creation = w.creation_date if isinstance(w.creation_date, datetime) else w.creation_date[0]
            age_days = (datetime.now() - creation).days
            if age_days < 30:
                risk_score += 40
                red_flags.append({"flag": "Newly Registered Domain", "explanation": f"Domain registered only {age_days} days ago. Fresh domains are commonly used for phishing."})
                detected_issues.append(f"Domain is only {age_days} days old")
    except Exception:
        pass

    # Try to fetch page content
    try:
        resp = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(resp.text, 'html.parser')
        forms = soup.find_all('form')
        password_inputs = soup.find_all('input', {'type': 'password'})
        if password_inputs and len(forms) > 0:
            risk_score += 20
            red_flags.append({"flag": "Login Form Detected", "explanation": "Page contains password input fields, which may be harvesting credentials."})
            detected_issues.append("Contains credential harvesting form")
    except Exception:
        pass

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        classification = "High Risk"
    elif risk_score >= 40:
        classification = "Suspicious"
    else:
        classification = "Safe"

    return {
        "analysis_type": "url",
        "input": url,
        "risk_score": risk_score,
        "classification": classification,
        "detected_issues": detected_issues,
        "red_flags": red_flags,
        "features": features
    }
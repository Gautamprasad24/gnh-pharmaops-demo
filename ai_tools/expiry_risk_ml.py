
# You can push this to GitHub as `gnh-pharmaops-demo` and share the link.

# ---

# ## 3️⃣ Python ML Integration (Code + How to Explain)

# Goal: you should be able to say:

# > “Right now I’ve implemented risk scoring as simple logic, but I have structured it so we can plug in a real ML model later. I also added a demo of how Node.js can call a Python script.”

# ### (A) New Python Script – `expiry_risk_ml.py`

# **File: `ai_tools/expiry_risk_ml.py`**

# This script acts like a “mock ML model service”: it takes an expiry date, returns JSON.

# ```python
import sys
import json
from datetime import datetime

def predict_expiry_risk(expiry_date_str: str) -> dict:
    """
    This simulates an ML model.
    In a real setup, we could load a trained model (pickle / ONNX)
    and use features like:
    - days_to_expiry
    - historical demand
    - warehouse location
    - temperature excursions, etc.
    """

    today = datetime.today().date()
    expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
    diff_days = (expiry_date - today).days

    # Simulated prediction logic (replaceable by ML model)
    if diff_days < 0:
        label = "Expired"
        score = 0.99
        comment = "Batch already expired."
    elif diff_days < 60:
        label = "High"
        score = 0.85
        comment = "Very high expiry risk. Prioritize dispatch."
    elif diff_days < 120:
        label = "Medium"
        score = 0.6
        comment = "Monitor closely and plan inventory."
    else:
        label = "Low"
        score = 0.2
        comment = "Low risk based on current date."

    return {
        "expiry_date": expiry_date_str,
        "days_to_expiry": diff_days,
        "predicted_label": label,
        "risk_score": score,
        "comment": comment
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "expiry_date argument missing"}))
        return

    expiry_date_str = sys.argv[1]
    result = predict_expiry_risk(expiry_date_str)
    print(json.dumps(result))

if __name__ == "__main__":
    main()

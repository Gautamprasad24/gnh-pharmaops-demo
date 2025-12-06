from datetime import datetime

def calculate_expiry_risk(expiry_date_str: str) -> dict:
  """
  expiry_date_str: 'YYYY-MM-DD'
  """
  today = datetime.today().date()
  expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
  diff_days = (expiry_date - today).days

  if diff_days < 0:
    risk = "Expired"
    comment = "Batch already expired. Remove from inventory."
  elif diff_days < 90:
    risk = "High"
    comment = "Expiry is near, prioritize dispatch or discount."
  elif diff_days < 180:
    risk = "Medium"
    comment = "Monitor movement and adjust planning."
  else:
    risk = "Low"
    comment = "Safe stock, no immediate action."

  return {
    "expiry_date": expiry_date_str,
    "days_to_expiry": diff_days,
    "risk_level": risk,
    "comment": comment
  }

if __name__ == "__main__":
  sample_date = input("Enter expiry date (YYYY-MM-DD): ")
  result = calculate_expiry_risk(sample_date)
  print("---- Expiry Risk Report ----")
  for k, v in result.items():
    print(f"{k}: {v}")

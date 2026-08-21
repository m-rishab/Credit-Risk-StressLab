from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os
import joblib
import pandas as pd
import numpy as np
import shap
import warnings
warnings.filterwarnings('ignore')

# Load .env file securely if it exists
if os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

app = Flask(__name__)

# ---------------------------------------------------------
# 1. Load Model & Preprocessor ONCE (When server starts)
# ---------------------------------------------------------
print("Loading ML Model and Preprocessor...")
model = joblib.load('xgb_credit_model.pkl')
preprocessor = joblib.load('ohe_preprocessor.pkl')

# Initialize SHAP Explainer
explainer = shap.TreeExplainer(model)

# NVIDIA NIM OpenAI-compatible client for GenAI explanations
nvidia_client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv('NVIDIA_API_KEY', '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')
)
AI_MODEL = 'meta/llama-3.1-8b-instruct'

# Get exact feature names expected by the model after OHE
feature_names = preprocessor.get_feature_names_out()
clean_features = [name.replace("cat__", "").replace("remainder__", "") for name in feature_names]
print("Loaded successfully!")

# ---------------------------------------------------------
# 2. Routes
# ---------------------------------------------------------
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/test')
def test():
    return render_template('test.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON data from frontend JS
        data = request.json

        # 3. Create a DataFrame exactly like training data
        input_data = pd.DataFrame([{
            'Age': int(data['Age']),
            'Sex': data['Sex'],
            'Employment_Type': data['Employment_Type'],
            'Monthly_Income_INR': int(data['Monthly_Income_INR']),
            'Existing_EMI_INR': int(data['Existing_EMI_INR']),
            'CIBIL_Score': int(data['CIBIL_Score']),
            'Loan_Amount_INR': int(data['Loan_Amount_INR']),
            'Loan_Purpose': data['Loan_Purpose'],
            'Housing_Type': data['Housing_Type'],
            'Loan_Tenure_Months': int(data['Loan_Tenure_Months'])
        }])

        # 4. Preprocess (One-Hot Encoding)
        processed_data = preprocessor.transform(input_data)

        # 5. Predict Probability
        default_prob = float(model.predict_proba(processed_data)[0][1])
        decision = "REJECT" if default_prob > 0.5 else "APPROVE"

        # 6. Calculate SHAP values for this specific user
        shap_values = explainer.shap_values(processed_data)

        # Format SHAP data for frontend charts (List of {feature, value})
        shap_list = []
        for i, feat in enumerate(clean_features):
            shap_list.append({
                "feature": feat,
                "value": float(shap_values[0][i])
            })

        # 7. GenAI explanation (NVIDIA-hosted Llama)
        sorted_shap = sorted(shap_list, key=lambda d: d['value'], reverse=True)
        top_risks = sorted_shap[:2]
        good_factors = sorted_shap[-2:]
        
        language = data.get('language', 'english')
        lang_instruction = "Write the response in English."
        if language.lower() == 'hindi':
            lang_instruction = "Write the response in simple Hindi using Devanagari script."
        elif language.lower() == 'hinglish':
            lang_instruction = "Write the response in simple Hinglish (Hindi language written in Roman/Latin script)."

        ai_prompt = (
            "You are a senior bank credit risk officer. "
            f"The loan decision is: {decision}. "
            f"The predicted probability of default is {round(default_prob * 100, 2)}%. "
            f"The top 2 risk factors are: "
            + ", ".join(f"{d['feature']} (impact {d['value']:.2f})" for d in top_risks)
            + ". The top 2 positive/good factors are: "
            + ", ".join(f"{d['feature']} (impact {d['value']:.2f})" for d in good_factors)
            + f". Write a strict 2-line professional reason for this decision. {lang_instruction} "
            "No markdown formatting."
        )

        ai_explanation = 'Analyzing...'
        try:
            ai_response = nvidia_client.chat.completions.create(
                model=AI_MODEL,
                messages=[{"role": "user", "content": ai_prompt}],
                temperature=0.2,
                max_tokens=100,
                timeout=5.0
            )
            ai_explanation = ai_response.choices[0].message.content
        except Exception:
            ai_explanation = 'AI analysis unavailable'

        # 8. Return JSON response to JavaScript
        return jsonify({
            "status": "success",
            "decision": decision,
            "probability": round(default_prob, 4),
            "shap_data": shap_list,
            "base_value": float(explainer.expected_value),
            "ai_explanation": ai_explanation
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        history = data.get('history', [])
        values = data.get('values', {})
        decision = data.get('decision', 'N/A')
        probability = data.get('probability', 0.0)
        language = data.get('language', 'english')
        
        lang_instruction = "Respond in English."
        if language.lower() == 'hindi':
            lang_instruction = "Respond in simple Hindi using Devanagari script."
        elif language.lower() == 'hinglish':
            lang_instruction = "Respond in simple Hinglish (Hindi written in Roman/Latin script)."

        system_prompt = (
            "You are a friendly, helpful AI Credit Risk Advisor at a bank. "
            "You help applicants and credit officers understand loan decisions and how credit risk works. "
            f"The applicant's current data: {values}. "
            f"The model's risk decision: {decision} (Probability of Default: {probability * 100:.2f}%). "
            "Always keep your answers concise (2-4 sentences max), encouraging, and clear to a non-technical user. "
            f"{lang_instruction} Do not use complex math or raw SHAP values in your explanations."
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        ai_response = nvidia_client.chat.completions.create(
            model=AI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=150,
            timeout=5.0
        )
        reply = ai_response.choices[0].message.content
        return jsonify({"status": "success", "reply": reply})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    # Run Flask on port 5001
    app.run(debug=True, port=5001)

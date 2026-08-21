const {
  useState,
  useRef,
  useEffect
} = React;

const prettyName = f => f.replace("num__", "").replace("cat__", "").replaceAll("_INR", "").replaceAll("_", " ");
const FEATURE_LABELS = {
  'Sex_male': 'Gender (Male)',
  'Sex_female': 'Gender (Female)',
  'Monthly_Income_INR': 'Monthly Income',
  'Existing_EMI_INR': 'Existing EMI',
  'CIBIL_Score': 'CIBIL Score',
  'Loan_Amount_INR': 'Loan Amount',
  'Loan_Tenure_Months': 'Loan Tenure'
};

const friendlyLabel = f => {
  const clean = f.replace('cat__', '').replace('remainder__', '').replace('num__', '');
  if (FEATURE_LABELS[clean]) return FEATURE_LABELS[clean];
  const m = clean.match(/^(Employment_Type|Loan_Purpose|Housing_Type)_(.+)$/);
  if (m) return prettyName(m[1]) + ': ' + m[2];
  return prettyName(clean);
};

const TRANSLATIONS = {
  english: {
    title: "Credit Risk StressLab",
    subtitle: "AI-powered loan default assessment with explainable risk factors",
    applicantDetails: "Applicant Details",
    assessRisk: "Assess Risk",
    assessing: "Assessing...",
    recommendation: "Model recommendation",
    defaultProb: "default probability",
    aiAdvisor: "AI Risk Advisor · Llama 3.1",
    whatImpacted: "Key Risk Factors (रिस्क के मुख्य कारण)",
    whatImpactedHint: "🔴 Red = Increases rejection risk | 🟢 Green = Decreases rejection risk",
    topDrivers: "Top 5 Factors at a Glance",
    topDriversHint: "↑ Increases rejection risk · ↓ Decreases rejection risk",
    placeholderText: "Fill in the applicant details on the left to get started. You'll get an approve/reject decision, an AI explanation, and a breakdown of what drove the decision.",
    scoringText: "Scoring applicant & consulting AI advisor...",
    stressScenarios: "Stress Test Scenarios",
    normalScenario: "Normal Condition",
    inflationScenario: "Inflation Shock",
    recessionScenario: "Recession Shock",
    jobLossScenario: "Severe Job Loss",
    askAIAdvisor: "Ask Llama Credit Advisor",
    typeQuestion: "Type your question here...",
    send: "Send"
  },
  hindi: {
    title: "क्रेडिट रिस्क स्ट्रेसलैब",
    subtitle: "एआई-संचालित ऋण चूक मूल्यांकन और रिस्क के स्पष्ट कारण",
    applicantDetails: "आवेदक का विवरण",
    assessRisk: "जोखिम का आकलन करें",
    assessing: "आकलन किया जा रहा है...",
    recommendation: "मॉडल की सिफारिश",
    defaultProb: "डिफ़ॉल्ट होने की संभावना",
    aiAdvisor: "एआई रिस्क एडवाइजर · लामा 3.1",
    whatImpacted: "रिस्क के मुख्य कारण (Key Risk Factors)",
    whatImpactedHint: "🔴 लाल = अस्वीकृति का जोखिम बढ़ाएगा | 🟢 हरा = अस्वीकृति का जोखिम घटाएगा",
    topDrivers: "शीर्ष 5 महत्वपूर्ण कारक",
    topDriversHint: "↑ अस्वीकृति का जोखिम बढ़ाता है · ↓ अस्वीकृति का जोखिम घटाता है",
    placeholderText: "शुरू करने के लिए बाईं ओर आवेदक का विवरण भरें। आपको स्वीकृति/अस्वीकृति का निर्णय, एआई स्पष्टीकरण और इसके कारणों का विश्लेषण मिलेगा।",
    scoringText: "आवेदक का स्कोर जांचा जा रहा है और एआई सलाहकार से संपर्क किया जा रहा है...",
    stressScenarios: "स्ट्रेस टेस्ट आर्थिक स्थिति",
    normalScenario: "सामान्य स्थिति",
    inflationScenario: "महंगाई का झटका",
    recessionScenario: "आर्थिक मंदी",
    jobLossScenario: "गंभीर नौकरी छूटना",
    askAIAdvisor: "लामा क्रेडिट सलाहकार से पूछें",
    typeQuestion: "अपना सवाल यहाँ लिखें...",
    send: "भेजें"
  },
  hinglish: {
    title: "Credit Risk StressLab",
    subtitle: "AI-powered loan default assessment aur risk factors ki explanation",
    applicantDetails: "Applicant Ki Details",
    assessRisk: "Risk Assess Karein",
    assessing: "Assess Ho Raha Hai...",
    recommendation: "Model recommendation",
    defaultProb: "default probability",
    aiAdvisor: "AI Risk Advisor · Llama 3.1",
    whatImpacted: "Risk ke main reasons (Key Risk Factors)",
    whatImpactedHint: "🔴 Red = Rejection risk badhata hai | 🟢 Green = Rejection risk kam karta hai",
    topDrivers: "Top 5 Factors at a Glance",
    topDriversHint: "↑ Rejection risk badhata hai · ↓ Rejection risk kam karta hai",
    placeholderText: "Shuru karne ke liye left me applicant ki details fill karein. Aapko approve/reject decision, AI explanation, aur iske main reasons milenge.",
    scoringText: "Applicant score compute ho raha hai aur AI advisor se consult kar rahe hain...",
    stressScenarios: "Stress Test Scenarios",
    normalScenario: "Normal Condition",
    inflationScenario: "Inflation Shock",
    recessionScenario: "Recession Shock",
    jobLossScenario: "Severe Job Loss",
    askAIAdvisor: "Ask Llama Credit Advisor",
    typeQuestion: "Apna question yahan type karein...",
    send: "Bhejein"
  }
};

/* ---------- Gauge: probability dial ---------- */
function RiskGauge({
  probability
}) {
  const ref = useRef(null);
  const prevPctRef = useRef(0);
  useEffect(() => {
    const targetPct = probability * 100;
    const startPct = prevPctRef.current;
    prevPctRef.current = targetPct;
    let rafId;
    const DURATION = 800;
    const startTime = performance.now();
    const getColor = p => p >= 70 ? '#b91c1c' : p >= 40 ? '#d97706' : '#15803d';
    const makeTrace = p => ({
      type: 'indicator',
      mode: 'gauge+number',
      value: p,
      number: {
        suffix: '%',
        valueformat: '.1f',
        font: {
          size: 34,
          color: '#111827'
        }
      },
      gauge: {
        axis: {
          range: [0, 100],
          tickwidth: 1,
          tickcolor: '#d1d5db',
          tickfont: {
            size: 10,
            color: '#9ca3af'
          }
        },
        bar: {
          color: getColor(p),
          thickness: .22
        },
        bgcolor: 'rgba(0,0,0,0)',
        borderwidth: 0,
        steps: [{
          range: [0, 40],
          color: '#ecfdf5'
        }, {
          range: [40, 70],
          color: '#fffbeb'
        }, {
          range: [70, 100],
          color: '#fef2f2'
        }],
        threshold: {
          line: {
            color: getColor(p),
            width: 3
          },
          thickness: .8,
          value: p
        }
      }
    });
    const layout = {
      margin: {
        t: 30,
        b: 10,
        l: 40,
        r: 40
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: {
        color: '#111827'
      }
    };
    const step = now => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / DURATION);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const pctNow = startPct + (targetPct - startPct) * easedProgress;
      if (ref.current) {
        Plotly.react(ref.current, [makeTrace(pctNow)], layout, {
          displayModeBar: false,
          staticPlot: true
        });
      }
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      if (ref.current) {
        Plotly.purge(ref.current);
      }
    };
  }, [probability]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      height: 190
    }
  });
}

/* ---------- SHAP waterfall ---------- */
function ShapWaterfall({
  shapData,
  baseValue
}) {
  const ref = useRef(null);
  useEffect(() => {
    const sorted = [...shapData].sort((a, b) => b.value - a.value).slice(0, 8);
    const x = sorted.map(d => friendlyLabel(d.feature));
    const finalY = sorted.map(d => d.value);
    const measures = sorted.map(() => 'relative');
    const fmt = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%';

    const layout = {
      autosize: true,
      showlegend: false,
      hovermode: 'closest',
      margin: {
        t: 20,
        b: 110,
        l: 55,
        r: 20
      },
      xaxis: {
        tickangle: -40,
        tickfont: {
          color: '#4b5563',
          size: 9.5
        },
        gridcolor: '#f3f4f6'
      },
      yaxis: {
        tickfont: {
          color: '#9ca3af',
          size: 9
        },
        gridcolor: '#f3f4f6',
        zerolinecolor: '#d1d5db'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    };

    const makeTrace = yNow => ({
      type: 'waterfall',
      orientation: 'v',
      x,
      y: yNow,
      measure: measures,
      text: yNow.map(v => Math.abs(v) < 1e-9 ? '' : fmt(v)),
      textposition: 'outside',
      hovertemplate: '<b>%{x}</b><br>Impact on Risk: %{text}<extra></extra>',
      textfont: {
        size: 9,
        color: '#6b7280'
      },
      increasing: {
        marker: {
          color: '#ef4444'
        }
      },
      decreasing: {
        marker: {
          color: '#22c55e'
        }
      },
      totals: {
        marker: {
          color: '#111827'
        }
      },
      connector: {
        line: {
          color: '#d1d5db',
          width: 1
        }
      }
    });

    let rafId;
    const DURATION = 1100;
    const STAGGER = 0.09;
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / DURATION);
      const yNow = finalY.map((v, i) => {
        const delay = i * STAGGER;
        const span = Math.max(0.2, 1 - delay);
        const local = Math.max(0, Math.min(1, (t - delay) / span));
        const eased = 1 - Math.pow(1 - local, 3);
        return v * eased;
      });
      if (ref.current) {
        Plotly.react(ref.current, [makeTrace(yNow)], layout, { displayModeBar: false });
      }
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      if (ref.current) {
        Plotly.purge(ref.current);
      }
    };
  }, [shapData, baseValue]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      height: 320
    }
  });
}

/* ---------- Plain-language drivers ---------- */
function DriverList({
  shapData
}) {
  const drivers = [...shapData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 5);
  const max = Math.max(...drivers.map(d => Math.abs(d.value)), 0.001);
  return /*#__PURE__*/React.createElement("div", {
    className: "driver-list"
  }, drivers.map((d, i) => {
    const w = Math.abs(d.value) / max * 50;
    return /*#__PURE__*/React.createElement("div", {
      className: "driver",
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "name"
    }, friendlyLabel(d.feature)), /*#__PURE__*/React.createElement("span", {
      className: "bar-wrap"
    }, d.value < 0 && /*#__PURE__*/React.createElement("span", {
      className: "bar-neg",
      style: {
        width: w + '%'
      }
    }), d.value >= 0 && /*#__PURE__*/React.createElement("span", {
      className: "bar-pos",
      style: {
        width: w + '%'
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: 'arrow ' + (d.value >= 0 ? 'up' : 'down')
    }, d.value >= 0 ? '\u2191' : '\u2193'));
  }));
}

/* ---------- Form Configuration ---------- */
const FIELD_GROUPS = [[{
  name: 'Age',
  label: 'Age',
  type: 'number',
  value: 35,
  min: 18,
  max: 80,
  step: 1
}, {
  name: 'Sex',
  label: 'Sex',
  options: ['female', 'male'],
  value: 'male'
}], [{
  name: 'Employment_Type',
  label: 'Employment Type',
  options: ['Highly Skilled', 'Skilled Employee', 'Unskilled', 'Unskilled Resident'],
  value: 'Skilled Employee'
}], [{
  name: 'Monthly_Income_INR',
  label: 'Monthly Income',
  type: 'number',
  value: 60000,
  min: 10000,
  max: 300000,
  step: 5000
}, {
  name: 'Existing_EMI_INR',
  label: 'Existing EMI',
  type: 'number',
  value: 5000,
  min: 0,
  max: 100000,
  step: 1000
}], [{
  name: 'CIBIL_Score',
  label: 'CIBIL Score (300–900)',
  type: 'number',
  value: 780,
  min: 300,
  max: 900,
  step: 10
}], [{
  name: 'Loan_Amount_INR',
  label: 'Loan Amount',
  type: 'number',
  value: 200000,
  min: 20000,
  max: 1000000,
  step: 10000
}, {
  name: 'Loan_Tenure_Months',
  label: 'Tenure (months)',
  type: 'number',
  value: 36,
  min: 6,
  max: 60,
  step: 6
}], [{
  name: 'Loan_Purpose',
  label: 'Loan Purpose',
  options: ['Business Loan', 'Consumer Durable Loan', 'Education Loan', 'Home Renovation Loan', 'Personal Loan', 'Vehicle Loan'],
  value: 'Personal Loan'
}, {
  name: 'Housing_Type',
  label: 'Housing Type',
  options: ['Family-Owned', 'Rented', 'Self-Owned'],
  value: 'Self-Owned'
}]];

const BASELINE_VALUES = {
  Age: 35,
  Sex: 'male',
  Employment_Type: 'Skilled Employee',
  Monthly_Income_INR: 60000,
  Existing_EMI_INR: 5000,
  CIBIL_Score: 780,
  Loan_Amount_INR: 200000,
  Loan_Tenure_Months: 36,
  Loan_Purpose: 'Personal Loan',
  Housing_Type: 'Self-Owned'
};

const FIELDS = FIELD_GROUPS.flat();

function App() {
  const [values, setValues] = useState(Object.fromEntries(FIELDS.map(f => [f.name, f.value])));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New features state
  const [language, setLanguage] = useState('english');
  const [activeScenario, setActiveScenario] = useState('normal');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const t = (key) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['english'][key] || key;
  };

  const set = (name, v) => setValues(prev => ({
    ...prev,
    [name]: v
  }));

  // Auto-calculation logic on values change (debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const runPredict = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch('/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...values, language })
          });
          const out = await res.json();
          if (out.status !== 'success') throw new Error(out.message || 'Prediction failed');
          setResult(out);
        } catch (err) {
          setError(err.message);
          setResult(null);
        } finally {
          setLoading(false);
        }
      };
      
      runPredict();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [values, language]);

  const applyScenario = (scenario) => {
    setActiveScenario(scenario);
    let newValues = { ...BASELINE_VALUES };
    if (scenario === 'inflation') {
      newValues.Existing_EMI_INR = 20000;
      newValues.Monthly_Income_INR = 50000;
    } else if (scenario === 'recession') {
      newValues.Monthly_Income_INR = 30000;
      newValues.CIBIL_Score = 600;
      newValues.Housing_Type = 'Rented';
    } else if (scenario === 'job_loss') {
      newValues.Monthly_Income_INR = 0;
      newValues.Existing_EMI_INR = 35000;
    }
    setValues(newValues);
    setChatHistory([]);
  };

  const submit = e => {
    e.preventDefault();
  };

  return /*#__PURE__*/React.createElement("div", {
    className: "shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header",
    style: { position: 'relative' }
  }, /*#lang dropdown*//*#__PURE__*/React.createElement("div", {
    style: { position: 'absolute', right: '10px', top: '10px', zIndex: 10 }
  }, /*#__PURE__*/React.createElement("select", {
    value: language,
    onChange: e => setLanguage(e.target.value),
    style: { width: 'auto', padding: '6px 12px', fontSize: '.8rem', borderRadius: '8px', cursor: 'pointer' }
  }, /*#__PURE__*/React.createElement("option", { value: "english" }, "English"), /*#__PURE__*/React.createElement("option", { value: "hindi" }, "हिंदी (Hindi)"), /*#__PURE__*/React.createElement("option", { value: "hinglish" }, "Hinglish"))), /*#__PURE__*/React.createElement("div", {
    className: "logo"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo-dot"
  }), /*#__PURE__*/React.createElement("h1", null, t('title'))), /*#__PURE__*/React.createElement("p", null, t('subtitle'))), /*#__PURE__*/React.createElement("div", {
    className: "columns"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card form-card"
  }, /*#stress scenarios*//*#__PURE__*/React.createElement("h2", null, t('stressScenarios')), /*#__PURE__*/React.createElement("div", {
    className: "scenarios-grid",
    style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }
  }, [['normal', 'normalScenario'], ['inflation', 'inflationScenario'], ['recession', 'recessionScenario'], ['job_loss', 'jobLossScenario']].map(([sc, langKey]) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: sc,
    onClick: () => applyScenario(sc),
    style: {
      padding: '8px 10px',
      fontSize: '.72rem',
      fontWeight: '600',
      borderRadius: '8px',
      border: activeScenario === sc ? '2px solid #111827' : '1px solid #d1d5db',
      background: activeScenario === sc ? '#111827' : '#fff',
      color: activeScenario === sc ? '#fff' : '#111827',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    }
  }, t(langKey)))), /*#__PURE__*/React.createElement("h2", null, t('applicantDetails')), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit
  }, FIELD_GROUPS.map((group, gi) => /*#__PURE__*/React.createElement("div", {
    className: group.length === 2 ? 'row' : '',
    key: gi,
    style: {
      display: 'flex',
      gap: 12
    }
  }, group.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.name,
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", null, f.label), f.options ? /*#__PURE__*/React.createElement("select", {
    value: values[f.name],
    onChange: e => set(f.name, e.target.value)
  }, f.options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, prettyName(o)))) : /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', flexDirection: 'column', gap: '4px' }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: values[f.name],
    min: f.min,
    max: f.max,
    required: true,
    onChange: e => set(f.name, Number(e.target.value) || 0)
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    value: values[f.name],
    min: f.min,
    max: f.max,
    step: f.step || 1,
    style: { margin: '4px 0 8px 0', cursor: 'pointer', accentColor: '#111827' },
    onChange: e => set(f.name, Number(e.target.value) || 0)
  }))))))), error && /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error)), /*#__PURE__*/React.createElement("div", null, !result && !loading && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "placeholder"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icon"
  }, "\uD83D\uDCC8"), /*#__PURE__*/React.createElement("p", null, t('placeholderText')))), loading && !result && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "placeholder"
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner",
    style: {
      width: 34,
      height: 34,
      borderWidth: 4
    }
  }), /*#__PURE__*/React.createElement("p", null, t('scoringText')))), result && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "card decision-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: 'decision ' + (result.decision === 'APPROVE' ? 'approve' : 'reject')
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "verdict"
  }, result.decision === 'APPROVE' ? '\u2713 APPROVE' : '\u2717 REJECT'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '.75rem',
      color: '#6b7280',
      marginTop: 4
    }
  }, t('recommendation'))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "prob-big"
  }, (result.probability * 100).toFixed(2), "%"), /*#__PURE__*/React.createElement("div", {
    className: "prob-label"
  }, t('defaultProb')))), /*#__PURE__*/React.createElement(RiskGauge, {
    probability: result.probability
  })), /*#__PURE__*/React.createElement("div", {
    className: "ai-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ai-label"
  }, t('aiAdvisor')), /*#__PURE__*/React.createElement("p", {
    className: 'ai-text' + (result.ai_explanation === 'Analyzing...' ? ' loading' : '')
  }, result.ai_explanation)), /*#__PURE__*/React.createElement("div", {
    className: "charts-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chart-block"
  }, /*#__PURE__*/React.createElement("h3", null, t('whatImpacted')), /*#__PURE__*/React.createElement("p", {
    className: "hint"
  }, t('whatImpactedHint')), /*#__PURE__*/React.createElement(ShapWaterfall, {
    shapData: result.shap_data,
    baseValue: result.base_value
  })), /*#__PURE__*/React.createElement("div", {
    className: "chart-block"
  }, /*#__PURE__*/React.createElement("h3", null, t('topDrivers')), /*#__PURE__*/React.createElement("p", {
    className: "hint"
  }, t('topDriversHint')), /*#__PURE__*/React.createElement(DriverList, {
    shapData: result.shap_data
  }))), /*#chat drawer*//*#__PURE__*/React.createElement("div", {
    className: "chart-block chat-card",
    style: { marginTop: '18px' }
  }, /*#__PURE__*/React.createElement("h3", null, t('askAIAdvisor')), /*#__PURE__*/React.createElement("p", {
    className: "hint",
    style: { marginBottom: '10px' }
  }, "Ask follow-up questions about this applicant's risk"), /*#chat messages*//*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '220px',
      overflowY: 'auto',
      padding: '10px',
      background: '#f9fafb',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
      marginBottom: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, chatHistory.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: { fontSize: '.75rem', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }
  }, "No questions yet. Ask something like 'How can CIBIL be improved?'"), chatHistory.map((msg, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    style: {
      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
      background: msg.role === 'user' ? '#111827' : '#eff6ff',
      color: msg.role === 'user' ? '#fff' : '#1e3a8a',
      padding: '8px 12px',
      borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
      maxWidth: '85%',
      fontSize: '.78rem',
      lineHeight: '1.4',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }
  }, msg.content)), chatLoading && /*#__PURE__*/React.createElement("div", {
    style: { alignSelf: 'flex-start', color: '#9ca3af', fontSize: '.75rem' }
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner",
    style: { width: 10, height: 10, marginRight: 5 }
  }), " Llama thinking...")), /*#chat input form*//*#__PURE__*/React.createElement("form", {
    onSubmit: async e => {
      e.preventDefault();
      if (chatInput.trim() === '' || chatLoading) return;
      const userMsg = chatInput.trim();
      setChatInput('');
      const updatedHistory = [...chatHistory, {
        role: 'user',
        content: userMsg
      }];
      setChatHistory(updatedHistory);
      setChatLoading(true);
      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            history: updatedHistory,
            values: values,
            decision: result.decision,
            probability: result.probability,
            language: language
          })
        });
        const out = await res.json();
        if (out.status !== 'success') throw new Error(out.message || 'Chat request failed');
        setChatHistory([...updatedHistory, {
          role: 'assistant',
          content: out.reply
        }]);
      } catch (err) {
        setChatHistory([...updatedHistory, {
          role: 'assistant',
          content: "Sorry, I couldn't process that question."
        }]);
      } finally {
        setChatLoading(false);
      }
    },
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: chatInput,
    placeholder: t('typeQuestion'),
    onChange: e => setChatInput(e.target.value),
    style: {
      flex: 1,
      padding: '8px 12px',
      fontSize: '.8rem',
      borderRadius: '8px',
      border: '1px solid #d1d5db'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "primary",
    style: {
      width: 'auto',
      margin: 0,
      padding: '8px 16px',
      fontSize: '.8rem',
      borderRadius: '8px'
    }
  }, t('send'))))))), /*#__PURE__*/React.createElement("footer", null, "XGBoost \xB7 SHAP Explainability \xB7 Llama 3.1 via NVIDIA NIM"));
}

ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
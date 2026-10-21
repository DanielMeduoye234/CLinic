import { GoogleGenerativeAI } from '@google/generative-ai';
import { TriageUrgency } from './types';

export interface GeminiTriageOutput {
  urgency: TriageUrgency;
  primary_specialty: string;
  secondary_specialty?: string;
  is_emergency: boolean;
  emergency_instructions?: string;
  patient_friendly_summary: string;
  physician_clinical_note: string;
  suggested_doctor_questions: string[];
}

const GEMINI_SYSTEM_INSTRUCTION = `
You are CLINIC AI, a specialized clinical triage and doctor-matching intelligence.
Your task is to analyze patient symptom descriptions, evaluate clinical urgency, determine the appropriate medical specialty, and generate summaries for both the patient and the physician.

STRICT CLINICAL RULES:
1. EMERGENCY DETECTION (SAFETY FIRST):
   - You MUST classify urgency as "critical_emergency" if symptoms match any of the following:
     * Acute chest pain, pressure radiating to jaw, neck, or left arm
     * Sudden severe shortness of breath or cyanosis
     * Signs of stroke (FAST: facial drooping, arm weakness, slurred speech)
     * Severe uncontrollable hemorrhaging
     * Sudden loss of consciousness or severe neurological deficit
     * Acute anaphylaxis (throat swelling, tongue swelling, hives, wheezing)
     * Active suicidal or homicidal thoughts
   - In "critical_emergency", emergency_instructions MUST provide clear immediate direction to call emergency services (911 / EMS).

2. SPECIALTY MAPPING:
   - Map symptoms strictly to one of our verified platform specialties:
     ["General Practice", "Cardiology", "Dermatology", "Pediatrics", "Neurology", 
      "Psychiatry", "Gynecology & Obstetrics", "Orthopedics", "Ophthalmology", 
      "ENT", "Gastroenterology", "Urology", "Endocrinology", "Pulmonology"]

3. CLINICAL SUMMARIES:
   - patient_friendly_summary: Reassuring, clear, free of complex jargon, under 40 words.
   - physician_clinical_note: Concise SOAP-style triage note for the doctor under 60 words.

4. OUTPUT FORMAT:
   - You MUST output STRICT JSON ONLY matching this structure:
   {
     "urgency": "routine" | "moderate" | "urgent" | "critical_emergency",
     "primary_specialty": string,
     "secondary_specialty": string,
     "is_emergency": boolean,
     "emergency_instructions": string,
     "patient_friendly_summary": string,
     "physician_clinical_note": string,
     "suggested_doctor_questions": string[]
   }
`;

export async function analyzeSymptomsWithGemini(
  symptoms: string,
  duration?: string,
  painLevel?: number,
  additionalContext?: string
): Promise<GeminiTriageOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Rule-based emergency keywords pre-screen (runs always)
  const lowerSymptoms = symptoms.toLowerCase();
  const hasChestPain = lowerSymptoms.includes('chest pain') || lowerSymptoms.includes('heart attack') || lowerSymptoms.includes('radiating to left arm');
  const hasStrokeSigns = lowerSymptoms.includes('slurred speech') || lowerSymptoms.includes('facial drooping') || lowerSymptoms.includes('cannot move arm');
  const hasSevereBreathing = lowerSymptoms.includes('cannot breathe') || lowerSymptoms.includes('gasping for air') || lowerSymptoms.includes('lips turning blue');
  const hasSuicide = lowerSymptoms.includes('suicid') || lowerSymptoms.includes('end my life') || lowerSymptoms.includes('kill myself');

  if (hasChestPain || hasStrokeSigns || hasSevereBreathing || hasSuicide) {
    return {
      urgency: 'critical_emergency',
      primary_specialty: hasChestPain ? 'Cardiology' : hasStrokeSigns ? 'Neurology' : 'General Practice',
      is_emergency: true,
      emergency_instructions: 'These symptoms indicate a potential life-threatening emergency. Please call 911 (or local emergency medical services) or go to the nearest emergency room immediately.',
      patient_friendly_summary: 'Your described symptoms require immediate emergency medical care. Please contact emergency services right away.',
      physician_clinical_note: 'Patient screened positive for red-flag acute emergency symptoms. Direct emergency diversion recommended.',
      suggested_doctor_questions: ['Are you currently in a safe location with someone nearby?', 'Have emergency services been dispatched?']
    };
  }

  // If Gemini API Key is provided, call Gemini 2.0 / 1.5 Flash
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        },
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION
      });

      const prompt = `
Patient Symptoms: "${symptoms}"
Duration: ${duration || 'Not specified'}
Pain Level (1-10): ${painLevel || 'Not specified'}
Additional Clinical Context: ${additionalContext || 'None provided'}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed: GeminiTriageOutput = JSON.parse(responseText);
      return parsed;
    } catch (error) {
      console.error('Gemini API Error, falling back to clinical taxonomy engine:', error);
    }
  }

  // Intelligent deterministic fallback (ensures platform never fails even before user adds their API key)
  let specialty = 'General Practice';
  let urgency: TriageUrgency = 'routine';

  if (painLevel && painLevel >= 8) {
    urgency = 'urgent';
  } else if (painLevel && painLevel >= 5) {
    urgency = 'moderate';
  }

  if (lowerSymptoms.includes('rash') || lowerSymptoms.includes('skin') || lowerSymptoms.includes('acne') || lowerSymptoms.includes('eczema') || lowerSymptoms.includes('itch')) {
    specialty = 'Dermatology';
  } else if (lowerSymptoms.includes('headache') || lowerSymptoms.includes('migraine') || lowerSymptoms.includes('dizzy') || lowerSymptoms.includes('nerve')) {
    specialty = 'Neurology';
  } else if (lowerSymptoms.includes('child') || lowerSymptoms.includes('baby') || lowerSymptoms.includes('toddler') || lowerSymptoms.includes('infant')) {
    specialty = 'Pediatrics';
  } else if (lowerSymptoms.includes('stomach') || lowerSymptoms.includes('nausea') || lowerSymptoms.includes('vomit') || lowerSymptoms.includes('diarrhea') || lowerSymptoms.includes('acid')) {
    specialty = 'Gastroenterology';
  } else if (lowerSymptoms.includes('bone') || lowerSymptoms.includes('joint') || lowerSymptoms.includes('fracture') || lowerSymptoms.includes('knee') || lowerSymptoms.includes('ankle')) {
    specialty = 'Orthopedics';
  } else if (lowerSymptoms.includes('ear') || lowerSymptoms.includes('throat') || lowerSymptoms.includes('nose') || lowerSymptoms.includes('sinus') || lowerSymptoms.includes('cough')) {
    specialty = 'ENT';
  } else if (lowerSymptoms.includes('anxiety') || lowerSymptoms.includes('depress') || lowerSymptoms.includes('panic') || lowerSymptoms.includes('stress') || lowerSymptoms.includes('sleep')) {
    specialty = 'Psychiatry';
  } else if (lowerSymptoms.includes('heart') || lowerSymptoms.includes('palpitation') || lowerSymptoms.includes('blood pressure')) {
    specialty = 'Cardiology';
  } else if (lowerSymptoms.includes('eye') || lowerSymptoms.includes('vision') || lowerSymptoms.includes('sight')) {
    specialty = 'Ophthalmology';
  }

  return {
    urgency,
    primary_specialty: specialty,
    secondary_specialty: 'General Practice',
    is_emergency: false,
    patient_friendly_summary: `Your symptoms align with ${specialty}. We are matching you with an available specialist to review your case right now.`,
    physician_clinical_note: `Patient presents with: ${symptoms}. Duration: ${duration || 'unspecified'}. Self-reported pain: ${painLevel || 'unspecified'}/10.`,
    suggested_doctor_questions: [
      `When did the ${symptoms.split(' ')[0] || 'symptoms'} first begin?`,
      'Have you taken any medication or experienced this previously?'
    ]
  };
}

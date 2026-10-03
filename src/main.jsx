import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import './styles.css'

const phases = [
  { id: 'identity', title: 'Profile', label: 'Who is this record?' },
  { id: 'work', title: 'Work Pattern', label: 'Workload and environment' },
  { id: 'lifestyle', title: 'Lifestyle', label: 'Movement, sitting and sleep' },
  { id: 'diet', title: 'Diet & Habits', label: 'Food and daily habits' },
  { id: 'history', title: 'Health History', label: 'Relevant background' },
  { id: 'body', title: 'Body Metrics', label: 'Height and weight' },
  { id: 'blood', title: 'Blood Pressure', label: 'Two readings for reliability' },
  { id: 'review', title: 'Review & Submit', label: 'Check everything' }
]

const initial = {
  employee_id: '', age: '', gender: '', role: '', experience_years: '', work_mode: '', shift_type: '',
  work_hours_per_day: '', sitting_hours_per_day: '', commute_mins_per_day: '', sleep_hours: '',
  physical_activity_mins_week: '', diet_type: '', diet_salt_intake: '', fast_food_per_week: '',
  tea_coffee_cups_day: '', smoking: '', alcohol: '', family_history_htn: '', diabetes: '', known_htn: '',
  on_bp_medication: '', stress_scale_0_10: '', height_cm: '', weight_kg: '', sbp_1: '', dbp_1: '',
  sbp_2: '', dbp_2: '', pulse: ''
}

const options = {
  gender: ['Male', 'Female'],
  work_mode: ['Office', 'Hybrid', 'Remote'],
  shift_type: ['Day', 'Night', 'Rotational'],
  diet_type: ['Vegetarian', 'Eggetarian', 'Non-Vegetarian'],
  diet_salt_intake: ['Low', 'Medium', 'High'],
  smoking: ['Never', 'Former', 'Current'],
  alcohol: ['Never', 'Occasional', 'Regular'],
  yesno: ['No', 'Yes']
}

function number(value) {
  return value === '' ? null : Number(value)
}

function calculate(data) {
  const height = number(data.height_cm)
  const weight = number(data.weight_kg)
  const bmi = height && weight ? Number((weight / ((height / 100) ** 2)).toFixed(1)) : null
  const bmi_category = bmi === null ? null : bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
  const sbpAvg = data.sbp_1 !== '' && data.sbp_2 !== '' ? Math.round((Number(data.sbp_1) + Number(data.sbp_2)) / 2) : null
  const dbpAvg = data.dbp_1 !== '' && data.dbp_2 !== '' ? Math.round((Number(data.dbp_1) + Number(data.dbp_2)) / 2) : null
  let bp_category = null
  if (sbpAvg !== null && dbpAvg !== null) {
    if (sbpAvg >= 140 || dbpAvg >= 90) bp_category = 'Stage 2'
    else if (sbpAvg >= 130 || dbpAvg >= 80) bp_category = 'Stage 1'
    else if (sbpAvg >= 120 && dbpAvg < 80) bp_category = 'Elevated'
    else bp_category = 'Normal'
  }
  let risk = 0
  if (bmi !== null && bmi >= 25) risk++
  if (sbpAvg !== null && sbpAvg >= 130) risk++
  if (data.smoking === 'Current') risk++
  if (data.diabetes === 'Yes') risk++
  if (data.known_htn === 'Yes') risk++
  if (data.family_history_htn === 'Yes') risk++
  if (data.sleep_hours !== '' && Number(data.sleep_hours) < 6) risk++
  if (data.physical_activity_mins_week !== '' && Number(data.physical_activity_mins_week) < 150) risk++
  const risk_level = risk >= 4 ? 'High' : risk >= 2 ? 'Medium' : 'Low'
  const stress = number(data.stress_scale_0_10)
  const stress_category = stress === null ? null : stress >= 7 ? 'High' : stress >= 4 ? 'Moderate' : 'Low'
  const age = number(data.age)
  const age_group = age === null ? null : age < 30 ? '20-29' : age < 40 ? '30-39' : '40+'
  return { bmi, bmi_category, sbp_avg: sbpAvg, dbp_avg: dbpAvg, bp_category, risk_score: risk, risk_level, stress_category, age_group }
}

function Field({ label, hint, children, required = false }) {
  return <label className="field"><span>{label}{required && <b>*</b>}</span>{hint && <small>{hint}</small>}{children}</label>
}

function Input({ name, value, onChange, type = 'text', min, max, step, placeholder }) {
  return <input name={name} value={value} onChange={onChange} type={type} min={min} max={max} step={step} placeholder={placeholder} />
}

function Select({ name, value, onChange, items, placeholder = 'Select one' }) {
  return <select name={name} value={value} onChange={onChange}><option value="">{placeholder}</option>{items.map(x => <option key={x} value={x}>{x}</option>)}</select>
}

function Toggle({ name, value, onChange }) {
  return <div className="toggle-row">{options.yesno.map(x => <button key={x} type="button" className={value === x ? 'choice active' : 'choice'} onClick={() => onChange({ target: { name, value: x } })}>{x}</button>)}</div>
}

function App() {
  const [phase, setPhase] = useState(0)
  const [data, setData] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const derived = useMemo(() => calculate(data), [data])

  const update = e => setData(v => ({ ...v, [e.target.name]: e.target.value }))
  const next = () => { setStatus(''); setPhase(p => Math.min(p + 1, phases.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const back = () => { setStatus(''); setPhase(p => Math.max(p - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const requiredByPhase = {
    0: ['employee_id', 'age', 'gender', 'role'],
    1: ['experience_years', 'work_mode', 'shift_type', 'work_hours_per_day'],
    2: ['sitting_hours_per_day', 'commute_mins_per_day', 'sleep_hours', 'physical_activity_mins_week'],
    3: ['diet_type', 'diet_salt_intake', 'fast_food_per_week', 'tea_coffee_cups_day', 'smoking', 'alcohol'],
    4: ['family_history_htn', 'diabetes', 'known_htn', 'on_bp_medication', 'stress_scale_0_10'],
    5: ['height_cm', 'weight_kg'],
    6: ['sbp_1', 'dbp_1', 'sbp_2', 'dbp_2', 'pulse']
  }

  const validate = () => {
    const missing = (requiredByPhase[phase] || []).filter(k => data[k] === '')
    if (missing.length) { setStatus('Please complete the highlighted phase before continuing.'); return false }
    return true
  }

  const submit = async () => {
    setSaving(true); setStatus('')
    if (!supabase) { setSaving(false); setStatus('Add your Supabase URL and publishable key to .env.local first.'); return }
    const payload = { ...data, ...derived }
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
    const { error } = await supabase.from('employee_health_records').insert(payload)
    setSaving(false)
    if (error) { setStatus(error.message); return }
    setSubmitted(true)
  }

  if (submitted) return <div className="success-screen"><div className="success-icon">✓</div><p className="eyebrow">RECORD SAVED</p><h1>Collection complete.</h1><p>The employee record was successfully stored in Supabase.</p><button className="primary" onClick={() => { setData(initial); setPhase(0); setSubmitted(false) }}>Collect another record</button></div>

  const current = phases[phase]
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">P</div><div><strong>PulseDesk</strong><small>Data Collection</small></div></div>
      <div className="progress-label"><span>Collection progress</span><b>{Math.round(((phase + 1) / phases.length) * 100)}%</b></div>
      <div className="progress"><div style={{ width: `${((phase + 1) / phases.length) * 100}%` }} /></div>
      <nav>{phases.map((p, i) => <button key={p.id} className={i === phase ? 'step active' : i < phase ? 'step done' : 'step'} onClick={() => i <= phase && setPhase(i)}><span className="step-no">{i < phase ? '✓' : i + 1}</span><span><b>{p.title}</b><small>{p.label}</small></span></button>)}</nav>
      <div className="privacy"><span>●</span><div><b>Private collection</b><small>Use authenticated collectors and RLS before production.</small></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><p className="eyebrow">EMPLOYEE HEALTH DATA</p><h2>{current.title}</h2></div><div className="record-chip">Record <b>{data.employee_id || 'NEW'}</b></div></header>
      <section className="content">
        <div className="phase-heading"><div><p className="eyebrow">PHASE {phase + 1} OF {phases.length}</p><h1>{current.title}</h1><p>{current.label}</p></div><div className="phase-counter">{String(phase + 1).padStart(2, '0')} / {String(phases.length).padStart(2, '0')}</div></div>
        {status && <div className="alert">{status}</div>}

        {phase === 0 && <div className="panel-grid">
          <Field label="Employee ID" hint="Unique identifier" required><Input name="employee_id" value={data.employee_id} onChange={update} placeholder="EMP101" /></Field>
          <Field label="Age" required><Input name="age" value={data.age} onChange={update} type="number" min="18" max="100" placeholder="28" /></Field>
          <Field label="Gender" required><Select name="gender" value={data.gender} onChange={update} items={options.gender} /></Field>
          <Field label="Role" required><Input name="role" value={data.role} onChange={update} placeholder="Software Engineer" /></Field>
          <div className="info-card full"><span>01</span><div><b>Why this phase?</b><p>Establish the identity and basic profile of the employee before collecting workplace and health information.</p></div></div>
        </div>}

        {phase === 1 && <div className="panel-grid">
          <Field label="Experience (years)" required><Input name="experience_years" value={data.experience_years} onChange={update} type="number" min="0" max="60" /></Field>
          <Field label="Work mode" required><Select name="work_mode" value={data.work_mode} onChange={update} items={options.work_mode} /></Field>
          <Field label="Shift type" required><Select name="shift_type" value={data.shift_type} onChange={update} items={options.shift_type} /></Field>
          <Field label="Work hours / day" required><Input name="work_hours_per_day" value={data.work_hours_per_day} onChange={update} type="number" min="0" max="24" step="0.5" /></Field>
          <Field label="Stress score" hint="Collected later in Health History" ><div className="locked">Not collected in this phase</div></Field>
          <div className="metric-card full"><div className="metric"><b>{data.work_hours_per_day || '—'}</b><span>hours/day</span></div><div className="metric"><b>{data.work_mode || '—'}</b><span>work mode</span></div><div className="metric"><b>{data.shift_type || '—'}</b><span>shift</span></div></div>
        </div>}

        {phase === 2 && <div className="panel-grid">
          <Field label="Sitting hours / day" required><Input name="sitting_hours_per_day" value={data.sitting_hours_per_day} onChange={update} type="number" min="0" max="24" step="0.5" /></Field>
          <Field label="Commute minutes / day" required><Input name="commute_mins_per_day" value={data.commute_mins_per_day} onChange={update} type="number" min="0" max="600" /></Field>
          <Field label="Sleep hours / night" required><Input name="sleep_hours" value={data.sleep_hours} onChange={update} type="number" min="0" max="24" step="0.5" /></Field>
          <Field label="Physical activity / week (min)" required><Input name="physical_activity_mins_week" value={data.physical_activity_mins_week} onChange={update} type="number" min="0" max="3000" /></Field>
          <div className="insight full"><div className="insight-icon">↗</div><div><b>Collection tip</b><p>Capture typical weekly activity rather than a single unusually active day.</p></div></div>
        </div>}

        {phase === 3 && <div className="panel-grid">
          <Field label="Diet type" required><Select name="diet_type" value={data.diet_type} onChange={update} items={options.diet_type} /></Field>
          <Field label="Salt intake" required><Select name="diet_salt_intake" value={data.diet_salt_intake} onChange={update} items={options.diet_salt_intake} /></Field>
          <Field label="Fast food / week" required><Input name="fast_food_per_week" value={data.fast_food_per_week} onChange={update} type="number" min="0" max="30" /></Field>
          <Field label="Tea / coffee cups / day" required><Input name="tea_coffee_cups_day" value={data.tea_coffee_cups_day} onChange={update} type="number" min="0" max="30" /></Field>
          <Field label="Smoking" required><Select name="smoking" value={data.smoking} onChange={update} items={options.smoking} /></Field>
          <Field label="Alcohol" required><Select name="alcohol" value={data.alcohol} onChange={update} items={options.alcohol} /></Field>
        </div>}

        {phase === 4 && <div className="panel-grid">
          <Field label="Family history of hypertension" required><Toggle name="family_history_htn" value={data.family_history_htn} onChange={update} /></Field>
          <Field label="Diabetes" required><Toggle name="diabetes" value={data.diabetes} onChange={update} /></Field>
          <Field label="Known hypertension" required><Toggle name="known_htn" value={data.known_htn} onChange={update} /></Field>
          <Field label="Currently on BP medication" required><Toggle name="on_bp_medication" value={data.on_bp_medication} onChange={update} /></Field>
          <Field label="Stress scale" hint="0 = none, 10 = very high" required><div className="range-wrap"><input className="range" name="stress_scale_0_10" value={data.stress_scale_0_10} onChange={update} type="range" min="0" max="10" step="0.25" /><b>{data.stress_scale_0_10 || '0'}/10</b></div></Field>
          <div className="info-card full"><span>!</span><div><b>Keep this phase private</b><p>This section contains sensitive health-history information. Restrict access to authorized collectors only.</p></div></div>
        </div>}

        {phase === 5 && <div className="panel-grid">
          <Field label="Height (cm)" required><Input name="height_cm" value={data.height_cm} onChange={update} type="number" min="80" max="250" /></Field>
          <Field label="Weight (kg)" required><Input name="weight_kg" value={data.weight_kg} onChange={update} type="number" min="20" max="300" step="0.1" /></Field>
          <div className="metric-card full"><div className="metric"><b>{derived.bmi ?? '—'}</b><span>BMI</span></div><div className="metric"><b>{derived.bmi_category ?? '—'}</b><span>BMI category</span></div><div className="metric"><b>{data.height_cm || '—'}</b><span>height cm</span></div><div className="metric"><b>{data.weight_kg || '—'}</b><span>weight kg</span></div></div>
          <p className="calculated full">BMI and its category are calculated automatically. They are not entered manually.</p>
        </div>}

        {phase === 6 && <div className="panel-grid">
          <div className="reading-card"><div className="reading-head"><span>Reading 01</span><b>Resting</b></div><Field label="Systolic (SBP)" required><Input name="sbp_1" value={data.sbp_1} onChange={update} type="number" min="60" max="250" /></Field><Field label="Diastolic (DBP)" required><Input name="dbp_1" value={data.dbp_1} onChange={update} type="number" min="30" max="160" /></Field></div>
          <div className="reading-card"><div className="reading-head"><span>Reading 02</span><b>Repeat</b></div><Field label="Systolic (SBP)" required><Input name="sbp_2" value={data.sbp_2} onChange={update} type="number" min="60" max="250" /></Field><Field label="Diastolic (DBP)" required><Input name="dbp_2" value={data.dbp_2} onChange={update} type="number" min="30" max="160" /></Field></div>
          <Field label="Pulse (bpm)" required><Input name="pulse" value={data.pulse} onChange={update} type="number" min="30" max="220" /></Field>
          <div className="metric-card"><div className="metric"><b>{derived.sbp_avg ?? '—'} / {derived.dbp_avg ?? '—'}</b><span>average BP</span></div><div className="metric"><b>{derived.bp_category ?? '—'}</b><span>calculated category</span></div></div>
        </div>}

        {phase === 7 && <div className="review-layout">
          <div className="review-card"><div className="review-title"><div className="avatar">{data.employee_id ? data.employee_id.slice(-2) : '—'}</div><div><b>{data.employee_id || 'New record'}</b><span>{data.role || 'Role not entered'}</span></div></div><div className="review-grid"><Review label="Age" value={data.age} /><Review label="Gender" value={data.gender} /><Review label="Work mode" value={data.work_mode} /><Review label="Shift" value={data.shift_type} /><Review label="Sleep" value={data.sleep_hours ? `${data.sleep_hours} h` : '—'} /><Review label="Activity" value={data.physical_activity_mins_week ? `${data.physical_activity_mins_week} min/wk` : '—'} /><Review label="BMI" value={derived.bmi} /><Review label="BP average" value={derived.sbp_avg ? `${derived.sbp_avg}/${derived.dbp_avg}` : '—'} /></div></div>
          <div className="risk-card"><p className="eyebrow">AUTO-CALCULATED</p><h3>{derived.risk_level} risk</h3><div className="risk-number">{derived.risk_score}</div><span>risk factors detected</span><div className="risk-line"><i style={{ width: `${Math.min(100, derived.risk_score * 12.5)}%` }} /></div></div>
          <div className="review-card full"><h3>Derived fields that will be saved</h3><div className="tag-row"><span>BMI: {derived.bmi ?? '—'}</span><span>BMI category: {derived.bmi_category ?? '—'}</span><span>BP category: {derived.bp_category ?? '—'}</span><span>Stress: {derived.stress_category ?? '—'}</span><span>Age group: {derived.age_group ?? '—'}</span><span>Risk: {derived.risk_level}</span></div></div>
        </div>}

        <footer className="actions"><button className="secondary" onClick={back} disabled={phase === 0}>Back</button>{phase < phases.length - 1 ? <button className="primary" onClick={() => validate() && next()}>Continue <span>→</span></button> : <button className="primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save record'} <span>✓</span></button>}</footer>
      </section>
    </main>
  </div>
}

function Review({ label, value }) { return <div className="review-item"><span>{label}</span><b>{value || '—'}</b></div> }

createRoot(document.getElementById('root')).render(<App />)

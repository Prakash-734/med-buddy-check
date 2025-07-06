# 💊 MediCare - Medication Tracking App

A role-based medication tracking app built with **React + TypeScript + Supabase**.  
Supports **patients** and **caretakers** with real-time data, adherence tracking, and photo proof uploads.

---

## 🔗 Live Demo

🌐 **Deployed on Vercel:**  
👉 [https://med-buddy-check.vercel.app](https://med-buddy-check.vercel.app)

📂 **GitHub Repository:**  
👉 [https://github.com/Prakash-734/med-buddy-check](https://github.com/Prakash-734/med-buddy-check)

---

## 🚀 Features

### ✅ Authentication
- Supabase Auth for user login/signup
- Onboarding with patient/caretaker role

### ✅ Medications
- Add medication (name, dosage, frequency)
- View patient-specific medication list
- Mark as taken for the day
- Upload proof image (optional)

### ✅ Caretaker Features
- Add/edit/delete medications for a patient
- View patient logs and adherence

### ✅ Patient Features
- View own medications
- Mark medication as taken
- Upload image proof

---

## 📊 Tech Stack

- ⚛️ React + TypeScript
- 🔥 Supabase (Auth, Database, Storage)
- ⚙️ React Query (data fetching + optimistic updates)
- 💅 TailwindCSS (UI components & styling)
- 🧪 Vitest (unit testing)
- 🚀 Vercel (deployment)

---

## 🧪 Tests

Run tests with:

```bash
npx vitest run

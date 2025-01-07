# Listenify

<div align="center">

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://listenify-live.vercel.app/)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=flat&logo=discord&logoColor=white)](https://discord.gg/c3pxrhTCAB)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Demo](https://listenify-live.vercel.app/) • [Discord](https://discord.gg/c3pxrhTCAB) • [Features](#features) • [Installation](#installation) • [Usage](#usage)

</div>

A powerful web application for real-time speech transcription with AI-powered features. Transform your voice into text while leveraging advanced AI capabilities for enhanced productivity and learning.

## 🎯 Core Features

### 🎤 **Main Transcription Panel**
- Real-time speech-to-text conversion
- Multi-speaker differentiation
- Color-coded transcripts for clarity
  - Blue: Microphone input
  - Green: Speaker text
  - Gray: Interim transcripts
- Word and sentence selection capabilities
- Maximum word limit control

### 📝 **Recent Items Panel**
- Toggle between words and sentences view
- Quick access to recently selected items
- Word definitions and translations
- Sentence analysis and AI insights
- Easy deletion and management

### 🤖 **AI Chat Panel**
- Real-time AI interactions
- Markdown support for responses
- Custom prompt templates
- Chat history management
- Multiple AI model support

## ⚙️ Comprehensive Settings

### 🌍 **General**
- Speech language selection (20+ languages)
- Translation language preferences
- Font size customization
- Theme selection (Light/Dark)
- Word limit configuration

### 🎯 **Word & Text Actions**
- Custom action creation
- URL template support
- Icon customization
- Language-specific actions
- Quick access shortcuts

### 🤖 **AI Models**
- Multiple model support:
  - Google Gemini
  - GPT-4
  - GPT-3.5 Turbo
  - Claude 3
  - Custom models
- API key management
- Model switching
- Custom naming

### 📝 **AI Prompts**
- Custom prompt templates
- Word-specific prompts
- Text-specific prompts
- Variable support:
  - {word} - Selected word
  - {text} - Selected text
  - {speech_language_code} - Current speech language
  - {translation_language_code} - Target translation language

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```powershell
git clone https://github.com/Omar7001-B/Listenify.git
cd Listenify
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

### Configuration

1. AI Model Setup (Required):
   - Obtain API keys for desired AI models
   - Configure models in settings
   - Set up custom prompts
   - Choose default model

## 📖 Usage

1. **Transcription**
   - Click microphone to start/stop recording
   - View real-time transcription
   - Select words or sentences for actions
   - Clear or copy transcript as needed

2. **Recent Items**
   - Switch between words/sentences views
   - Click items for quick actions
   - Delete unwanted items
   - Access AI features directly

3. **AI Interaction**
   - Use predefined prompts
   - Create custom conversations
   - Get instant AI responses
   - Manage chat history

4. **Panel Management**
   - Resize panels as needed
   - Collapse/expand for better workspace
   - Persistent panel states
   - Responsive layout adaptation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License.

---
<div align="center">
Made with ❤️ by <a href="https://github.com/Omar7001-B">Omar7001-B</a>
</div> 
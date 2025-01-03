I want a project for transcription that utilizes a web API for speech-to-text. The project is called **Listenify**.

### Basic View:
1. **Live Transcription Area**: 
   - The live transcription will be displayed in the center of the screen.
   - Includes a microphone button to start/stop transcription.
   - Includes a "clear" button to delete the transcription.

2. **AI Chat Toggle**: 
   - On the right side of the screen, there will be a toggle button for AI chat.
   - When the user clicks on the toggle, the AI chat will appear/disappear.

3. **Saved Menu**: 
   - Located on the left side of the screen.
   - Displays two sections: 
     - "Words Saved" (last clicked words).
     - "Last Selected Sentences."
   - Each item will have a delete button to remove either a word or a sentence.
   - The "Word" section will be shown as a tab in the navigation bar.
   - Text will be shown accordingly.
   - The saved menu will also have a button to toggle the visibility of the entire menu (show/hide).

4. **Logout Button**: 
   - A logout button is included in the interface.

5. **Settings Button**: 
   - When clicked, the settings page will appear.
   - The settings page will have a tab with several options:
     - General
     - Words
     - Text
     - Prompts
     - Models

### Default Page (General Settings):
- **Theme**: Option to switch between light and dark themes.
- **Font Size**: A slider to adjust the font size for the live transcription.
- **Line Spacing**: A slider to adjust the line spacing for better readability.
- **Maximum Words Inside the Box**: The user can set the maximum number of words for the live transcription (default set to 100).
- **Language**: Speech-to-text language options (e.g., English, German, French, Spanish, Arabic).

### Word Pop-up Actions:
- Allows the user to choose what actions will occur when a user clicks on a word. The user can add actions like:
  - **Google Translator**: Default URL: `https://translate.google.com/?sl=en&tl=ar&text={word}&op=translate`
  - **Google Image**: Default URL: `https://www.google.com/search?hl=en&tbm=isch&q={word}`
  - **Dictionary.com**: Default URL: `https://www.dictionary.com/browse/{word}`
  - **Cambridge Dictionary**: Default URL: `https://dictionary.cambridge.org/dictionary/english-arabic/{word}`

### Text Actions:
- Similar to word pop-up actions but for entire selected text:
  - **Google Translator**: Default URL: `https://translate.google.com/?sl=en&tl=ar&text={text}&op=translate`
- Users can add their own custom actions for text as well.

### Prompts Page:
- Users can add custom AI prompts by providing a name and description.
- For example, a translation prompt:
  - **Name**: Translate
  - **Prompt**: "Please Translate this text: {text} from English into Arabic."

### Models Page:
- The user can add an AI model by providing the following:
  - **Model Name**: Name of the model (e.g., ChatGPT, Gemini, etc.).
  - **Model Type**: Dropdown to choose the model type (e.g., ChatGPT, Gemini, etc.).
  - **API Key**: Input field for the API key for the selected model.
- After adding the model, the user can select one model to be active for the project to use.

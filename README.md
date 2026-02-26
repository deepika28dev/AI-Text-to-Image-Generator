# AI Text-to-Image Generator

A modern, dark-themed AI Image Generator built with Flask and Hugging Face. This application uses **Stable Diffusion XL** to generate stunning images from text prompts, with a sleek glassmorphism UI and full generation history tracking.

## 🚀 Features

-   **Modern Glassmorphism UI**: A premium, dark-themed interface with gradient accents, ambient floating orbs, and smooth micro-animations.
-   **AI Image Generation**:
    -   Generate images from any text prompt.
    -   Powered by **Stable Diffusion XL** (`stabilityai/stable-diffusion-xl-base-1.0`) via Hugging Face Inference API.
    -   Real-time loading feedback with spinner animation.
-   **Generation History**:
    -   All generated images are saved and displayed in a responsive grid.
    -   View, download, or delete any past generation.
    -   Clear all history with a single click.
    -   Custom-styled confirmation modals for delete actions.
-   **Enhanced UX**:
    -   One-click image download.
    -   Character counter for prompts (max 500 chars).
    -   Keyboard shortcut — press `Enter` to generate.
    -   Responsive design for mobile, tablet, and desktop.

## 🛠️ Tech Stack

### Backend
-   **Framework**: [Flask](https://flask.palletsprojects.com/)
-   **AI Model**: [Stable Diffusion XL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) via Hugging Face Inference API
-   **ORM**: [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/) (SQLite)
-   **HTTP Client**: `requests`
-   **Env Management**: `python-dotenv`

### Frontend
-   **Language**: Vanilla JavaScript (ES6+)
-   **Styling**: Modern CSS3 (Vanilla) — Glassmorphism, gradients, animations
-   **Font**: [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
-   **Layout**: Flexbox & Grid (Mobile-first)

---

## ⚙️ Setup Instructions

### 1. Clone the Project
```bash
git clone <repository-url>
cd flask_vision_ai
```

### 2. Set Up Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Variables
Create a `.env` file in the root directory and add your Hugging Face API token:
```env
HF_API_TOKEN=your_hugging_face_api_token_here
```
> Get your free token at: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (Read access)

### 5. Run the Application
The application will automatically initialize the SQLite database on its first run.
```bash
python app.py
```
Access the app at: `http://127.0.0.1:5000`

---

## 📁 Project Structure

```
flask_vision_ai/
├── app.py                  # Flask app — routes, DB model, Hugging Face API logic
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (HF API token)
├── .gitignore              # Git ignore rules
├── generations.db          # SQLite database (auto-created on first run)
├── static/
│   ├── css/
│   │   └── style.css       # Full UI styles — glassmorphism, animations, responsive
│   ├── js/
│   │   └── script.js       # Frontend logic — generate, history, modals, helpers
│   └── generated/          # AI-generated images stored here
└── templates/
    └── index.html          # Main Jinja2 HTML template
```

---

## � API Endpoints

### Pages
-   `GET /`: Renders the main image generator UI.

### Image Generation
-   `POST /generate`: Generate an image from a JSON prompt `{"prompt": "..."}`.

### History
-   `GET /history`: Returns all past generations (newest first).
-   `DELETE /history/<id>`: Delete a specific generation and its image file.
-   `DELETE /history/clear`: Delete all generations and their image files.

---

## � Responsive Design

The UI is built with a **mobile-first approach**:
-   **Desktop**: Centered card layout (max 640px) with two-column history grid.
-   **Mobile**: Single-column layout, stacked header, and touch-optimized controls.

---

## ⚠️ Notes

-   The **Stable Diffusion XL** model may take ~30 seconds on the first request (cold start on Hugging Face). Subsequent requests are faster.
-   Generated images are saved locally in `static/generated/` and tracked in `generations.db`.
-   The `.env` file, `generations.db`, and `static/generated/` are excluded from version control via `.gitignore`.

## 📄 License

This project is for educational purposes. Feel free to use and modify it for your own AI image generation projects!

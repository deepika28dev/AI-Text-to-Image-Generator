import os
import uuid
import base64
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

from models import db, Generation, DBConfig, init_db

load_dotenv()

app = Flask(__name__)

# ── App & Database Configuration ─────────────────────────────────────
app.config.from_object(DBConfig)
basedir = os.path.abspath(os.path.dirname(__file__))

# ── Generated images directory ──────────────────────────────────────
GENERATED_DIR = os.path.join(basedir, "static", "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)

# Initialize database and create tables
init_db(app)

# ── Hugging Face Configuration ──────────────────────────────────────
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
HF_API_URL = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}"


# ── Routes ──────────────────────────────────────────────────────────
@app.route("/")
def index():
    """Render the image generator UI."""
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    """
    Generate an image from a text prompt using Hugging Face Inference API.
    Saves the result to disk and database.
    """
    data = request.get_json()
    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({"success": False, "error": "Please enter a prompt."}), 400

    if not HF_API_TOKEN:
        return jsonify({
            "success": False,
            "error": "Hugging Face API token not configured. Add HF_API_TOKEN to your .env file."
        }), 500

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {"inputs": prompt}

    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=120)

        if response.status_code == 503:
            return jsonify({
                "success": False,
                "error": "Model is loading, please try again in ~30 seconds."
            }), 503

        if response.status_code != 200:
            error_msg = "Image generation failed."
            try:
                err_data = response.json()
                error_msg = err_data.get("error", error_msg)
            except Exception:
                pass
            return jsonify({"success": False, "error": error_msg}), response.status_code

        # Save image to disk
        filename = f"{uuid.uuid4().hex}.png"
        filepath = os.path.join(GENERATED_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(response.content)

        # Save to database
        gen = Generation(prompt=prompt, filename=filename)
        db.session.add(gen)
        db.session.commit()

        # Return base64 for immediate display + record data
        image_b64 = base64.b64encode(response.content).decode("utf-8")
        return jsonify({
            "success": True,
            "image": image_b64,
            "generation": gen.to_dict(),
        })

    except requests.exceptions.Timeout:
        return jsonify({
            "success": False,
            "error": "Request timed out. The model may be busy — try again."
        }), 504
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/history")
def history():
    """Return all past generations, newest first."""
    try:
        generations = Generation.query.order_by(Generation.created_at.desc()).all()
        return jsonify([g.to_dict() for g in generations]), 200
    except Exception as e:
        # Log or handle internally as needed; return a safe response
        return jsonify({"success": False, "error": "Failed to load history."}), 500


@app.route("/history/<int:gen_id>", methods=["DELETE"])
def delete_generation(gen_id):
    """Delete a generation record and its image file."""
    try:
        gen = Generation.query.get(gen_id)
        if not gen:
            return jsonify({"success": False, "error": "Not found."}), 404

        # Delete image file
        filepath = os.path.join(GENERATED_DIR, gen.filename)
        if os.path.exists(filepath):
            os.remove(filepath)

        db.session.delete(gen)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to delete generation."}), 500


@app.route("/history/clear", methods=["DELETE"])
def clear_history():
    """Delete all generations and their image files."""
    try:
        # Delete all image files in the generated directory
        if os.path.exists(GENERATED_DIR):
            for filename in os.listdir(GENERATED_DIR):
                file_path = os.path.join(GENERATED_DIR, filename)
                if os.path.isfile(file_path):
                    try:
                        os.remove(file_path)
                    except OSError:
                        # Ignore individual file delete errors to allow DB cleanup
                        pass

        # Delete all database records
        Generation.query.delete()
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to clear history."}), 500


if __name__ == "__main__":
    app.run()

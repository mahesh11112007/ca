"""Flask application entry point for the CA Ledger Management System."""

import os
import sys

from dotenv import load_dotenv
from flask import Flask, jsonify, g
from flask_cors import CORS

# Ensure the backend directory is in the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables before importing anything else
load_dotenv()

from config.settings import get_settings
from database.connection import close_db
from database.init_db import init_db
from routes.auth import auth_bp
from routes.transactions import transactions_bp
from routes.dashboard import dashboard_bp


def create_app():
    """Application factory for the Flask app."""
    app = Flask(__name__)

    # Load settings
    settings = get_settings()

    # Configure CORS
    CORS(
        app,
        origins=settings.CORS_ORIGINS,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(dashboard_bp)

    # Initialize database tables
    with app.app_context():
        init_db()
        try:
            from seed_users import seed_users
            seed_users()
        except Exception as e:
            print(f"Error seeding users: {e}")

    # --- Teardown: close DB session after each request ---
    @app.teardown_appcontext
    def teardown_db(exception=None):
        db = g.pop("_database", None)
        if db is not None:
            if exception:
                db.rollback()
            close_db(db)

    # --- Global Error Handlers ---
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized", "message": "Authentication is required"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "message": "You do not have permission to access this resource"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": "The requested resource was not found"}), 404

    @app.errorhandler(409)
    def conflict(e):
        return jsonify({"error": "Conflict", "message": str(e)}), 409

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred"}), 500

    # --- Health check endpoint ---
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "healthy", "service": "CA Ledger Management System"}), 200

    return app


# Create the app instance
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=8000)

from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)

# Database setup
DB_PATH = 'scores.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            player_name TEXT PRIMARY KEY,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/scores', methods=['GET'])
def get_scores():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute(
                'SELECT player_name, score FROM scores ORDER BY score DESC LIMIT 10'
            )
            scores = [{'player_name': row[0], 'score': row[1]} for row in cursor.fetchall()]
            return jsonify(scores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scores', methods=['POST'])
def save_score():
    try:
        data = request.get_json()
        player_name = data.get('player_name')
        new_score = data.get('score')
        
        if not player_name or not new_score:
            return jsonify({'error': 'Missing player_name or score'}), 400
        
        with sqlite3.connect(DB_PATH) as conn:
            # Get current high score for player
            cursor = conn.execute(
                'SELECT score FROM scores WHERE player_name = ?',
                (player_name,)
            )
            result = cursor.fetchone()
            current_score = result[0] if result else 0

            # Only update if new score is higher
            if new_score > current_score:
                conn.execute('''
                    INSERT OR REPLACE INTO scores (player_name, score, timestamp)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                ''', (player_name, new_score))
                return jsonify({'success': True, 'updated': True})
            
            return jsonify({'success': True, 'updated': False})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Create static folder if it doesn't exist
    if not os.path.exists('static'):
        os.makedirs('static')
    
    # Run the app
    app.run(host='0.0.0.0', port=8080, debug=True)

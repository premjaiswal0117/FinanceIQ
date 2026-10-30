from app.database import engine
from sqlalchemy import text

conn = engine.connect()
cols = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'goals'")).fetchall()
print("Goals schema:", cols)

rows = conn.execute(text("SELECT goal_id, user_id, target_date, pg_typeof(target_date) FROM goals")).fetchall()
print("Goals rows:", rows)
conn.close()

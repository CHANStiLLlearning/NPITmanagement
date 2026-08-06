import sqlite3

db = sqlite3.connect('school.db')
cur = db.cursor()

# Check admin user
cur.execute("SELECT id, email, role, is_active, hashed_password FROM users WHERE email='admin@school.com'")
rows = cur.fetchall()
if rows:
    for r in rows:
        print(f"  id={r[0]}, email={r[1]}, role={r[2]}, is_active={r[3]}, hash_exists={bool(r[4])}, hash_prefix={r[4][:20] if r[4] else 'NULL'}")
else:
    print("  !! No admin@school.com user found !!")

# Count all users
cur.execute("SELECT COUNT(*) FROM users")
total = cur.fetchone()[0]
print(f"\nTotal users: {total}")

# List all users
cur.execute("SELECT email, role, is_active FROM users")
for row in cur.fetchall():
    print(f"  {row[0]}  |  {row[1]}  |  active={row[2]}")

db.close()

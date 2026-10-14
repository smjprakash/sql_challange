# SQL Mystery: The Vanishing Star

The Star of Asterion has appeared in an unexpected gallery. Use SQL to inspect the museum records, find the suspicious scan, and identify who made it.

The activity uses four tables and 12 questions. It practices selecting and filtering rows, sorting and limiting results, counting with `GROUP BY` and `HAVING`, joins, and subqueries. No window functions are needed.

## What you need

- MySQL, using MySQL Workbench or the `mysql` command-line client.
- A modern browser and an internet connection to load the game's SQLite engine.

## 1. Create and fill the database

In MySQL Workbench or the MySQL command-line client, copy and run this complete script. It creates a database named `vanishing_star`, creates the four tables, and inserts the sample rows. If you already have a database with these table names, use a new empty database to avoid duplicate-table or duplicate-row errors.

```sql
CREATE DATABASE IF NOT EXISTS vanishing_star;
USE vanishing_star;

CREATE TABLE staff (
  staff_id INT NOT NULL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  clearance_level INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE galleries (
  gallery_id INT NOT NULL PRIMARY KEY,
  gallery_name VARCHAR(100) NOT NULL UNIQUE,
  security_zone VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE artifacts (
  artifact_id VARCHAR(20) NOT NULL PRIMARY KEY,
  artifact_name VARCHAR(100) NOT NULL UNIQUE,
  home_gallery_id INT NOT NULL,
  estimated_value BIGINT NOT NULL,
  CONSTRAINT fk_artifacts_gallery
    FOREIGN KEY (home_gallery_id) REFERENCES galleries(gallery_id)
) ENGINE=InnoDB;

CREATE TABLE museum_events (
  event_id INT NOT NULL PRIMARY KEY,
  staff_id INT NOT NULL,
  gallery_id INT NOT NULL,
  event_time DATETIME NOT NULL,
  event_type VARCHAR(20) NOT NULL,
  artifact_id VARCHAR(20),
  CONSTRAINT fk_events_staff
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id),
  CONSTRAINT fk_events_gallery
    FOREIGN KEY (gallery_id) REFERENCES galleries(gallery_id),
  CONSTRAINT fk_events_artifact
    FOREIGN KEY (artifact_id) REFERENCES artifacts(artifact_id)
) ENGINE=InnoDB;

INSERT INTO staff VALUES
  (1, 'Ava Stone', 'Security', 'Security Officer', 4),
  (2, 'Ben Cole', 'Collections', 'Senior Curator', 4),
  (3, 'Cora Lin', 'Conservation', 'Conservator', 3),
  (4, 'Dev Malik', 'Museum Technology', 'Systems Technician', 5),
  (5, 'Eli Ward', 'Registration', 'Registrar', 3),
  (6, 'Finn Gray', 'Security', 'Night Guard', 2);

INSERT INTO galleries VALUES
  (1, 'Celestial Gallery', 'RESTRICTED'),
  (2, 'East Wing', 'RESTRICTED'),
  (3, 'Archive', 'RESTRICTED'),
  (4, 'Restoration Lab', 'RESTRICTED'),
  (5, 'Main Lobby', 'PUBLIC');

INSERT INTO artifacts VALUES
  ('ART-01', 'Star of Asterion', 1, 9500000),
  ('ART-02', 'Sun Mask', 2, 1800000),
  ('ART-03', 'Lunar Astrolabe', 3, 2400000),
  ('ART-04', 'Ivory Atlas', 4, 1200000);

INSERT INTO museum_events
  (event_id, staff_id, gallery_id, event_time, event_type)
VALUES
  (1, 1, 1, '2025-11-18 20:00:00', 'ENTRY'),
  (2, 1, 1, '2025-11-18 20:20:00', 'EXIT'),
  (3, 2, 2, '2025-11-18 20:10:00', 'ENTRY'),
  (4, 2, 2, '2025-11-18 20:30:00', 'EXIT'),
  (5, 3, 4, '2025-11-18 20:15:00', 'ENTRY'),
  (6, 3, 4, '2025-11-18 20:35:00', 'EXIT'),
  (7, 4, 3, '2025-11-18 20:30:00', 'ENTRY'),
  (8, 4, 3, '2025-11-18 20:40:00', 'EXIT'),
  (9, 5, 1, '2025-11-18 20:45:00', 'ENTRY'),
  (10, 5, 1, '2025-11-18 21:00:00', 'EXIT'),
  (11, 6, 3, '2025-11-18 21:10:00', 'ENTRY'),
  (12, 6, 3, '2025-11-18 21:20:00', 'EXIT'),
  (13, 4, 1, '2025-11-18 21:12:00', 'ENTRY'),
  (14, 4, 1, '2025-11-18 21:25:00', 'EXIT'),
  (15, 4, 1, '2025-11-18 21:42:00', 'ENTRY'),
  (16, 4, 2, '2025-11-18 21:48:00', 'ENTRY'),
  (17, 4, 1, '2025-11-18 21:50:00', 'EXIT'),
  (18, 4, 2, '2025-11-18 22:00:00', 'EXIT'),
  (19, 4, 3, '2025-11-18 22:30:00', 'ENTRY'),
  (20, 4, 3, '2025-11-18 22:40:00', 'EXIT'),
  (21, 4, 5, '2025-11-18 23:05:00', 'ENTRY'),
  (22, 4, 5, '2025-11-18 23:10:00', 'EXIT');

INSERT INTO museum_events
  (event_id, staff_id, gallery_id, event_time, event_type, artifact_id)
VALUES
  (23, 1, 1, '2025-11-18 18:00:00', 'ROUTINE_SCAN', 'ART-01'),
  (24, 2, 2, '2025-11-18 18:05:00', 'ROUTINE_SCAN', 'ART-02'),
  (25, 6, 3, '2025-11-18 18:10:00', 'ROUTINE_SCAN', 'ART-03'),
  (26, 3, 4, '2025-11-18 18:15:00', 'ROUTINE_SCAN', 'ART-04'),
  (27, 4, 2, '2025-11-18 21:49:00', 'ALERT_SCAN', 'ART-01'),
  (28, 2, 2, '2025-11-18 21:55:00', 'ALERT_SCAN', 'ART-02');
```

The `artifact_id` in `museum_events` is `NULL` for ordinary entries and exits. Scan events contain the artifact ID. MySQL stores `event_time` as `DATETIME`. Use a new or empty database if you need to run the setup again.

## 2. Start the game

Open `index.html` in a browser, enter your name, roll number, department, and section, then choose **Begin investigation**.

For each challenge:

1. Write a `SELECT` query in MySQL and run it there to inspect and check the output.
2. Paste the SQL query itself (not the output rows) into the box in the game and choose **Run Query**.
3. The game checks your query against its built-in copy of the sample data. It does not connect to your MySQL server. A challenge unlocks only when the query returns the expected result.

Use **View schema** on a challenge to review the table columns and relationships.

## 3. Challenges

The questions build from basic selection and filtering to `LIMIT`, aggregation with `GROUP BY`, joins, `HAVING`, and finally subqueries.

1. **Meet the artifacts:** Show the name of every artifact. Return `artifact_name` and sort the names alphabetically.
2. **Meet the security team:** Find staff in the Security department. Return `full_name`.
3. **Find restricted galleries:** Find the galleries marked `RESTRICTED`. Return `gallery_name`, sorted alphabetically.
4. **Staff with clearance:** Find staff with a clearance level of 3 or higher. Return `full_name` and `clearance_level`, sorted from highest clearance to lowest.
5. **Top three artifacts by value:** Find the three most valuable artifacts. Return `artifact_name` and `estimated_value`, ordered from highest value to lowest. Use `LIMIT` to return only three rows.
6. **Count event types:** Use `GROUP BY` to count how many times each `event_type` appears in `museum_events`. Return `event_type` and `event_count`, sorted by event type.
7. **Count staff by department:** Use `GROUP BY` to count staff members in each department. Return `department` and `staff_count`, sorted by department.
8. **Find each artifact's home:** Join artifacts to galleries to find where each artifact belongs. Return `artifact_name` and `gallery_name`, sorted by artifact name.
9. **Evening arrivals:** Find staff `ENTRY` events between 8:00 PM and 8:15 PM on November 18, 2025. Join staff and galleries. Return `full_name`, `gallery_name`, and `event_time` in time order.
10. **Restricted-gallery visits:** Count each staff member's `ENTRY` events into restricted galleries. Return `full_name` and `entry_count` for anyone with at least two such entries. Use `HAVING` to filter the grouped counts.
11. **Above-average artifacts:** Use a subquery to find artifacts worth more than the average artifact value. Return `artifact_name` and `estimated_value`, sorted from highest value to lowest.
12. **Who scanned the most valuable artifact?:** Use a subquery to find the most valuable artifact, then find the staff member who made an `ALERT_SCAN` of it. Return `full_name`.

Complete all 12 challenges to solve the mystery. Good luck!

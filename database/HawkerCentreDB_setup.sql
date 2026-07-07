/* =====================================================================
   HawkerCentreDB_setup.sql
   Singapore Hawker Centre Management System - Team master schema
   BED 2026-27 Assignment
 
   Feature ownership:
     Leslie  : Stall (supporting), MenuItem (primary), Cuisine,
               MenuItemCuisine (M:N), Promotion
     Justin  : Orders, OrderItem, Payment
     Russell : Customer (auth), Feedback, Likes (M:N), Complaint
     Arri    : RentalAgreement, NEAOfficer, Inspection, HygieneGrade
     Shared  : HawkerCentre, Operator, StallOwner
 
   HOW TO RUN:
     1. Open in SSMS
     2. Make sure you are connected to your local server
     3. Press F5 (Execute)
     4. Verify with the SELECT queries at the bottom
   ===================================================================== */

   /* =====================================================================
   RUSSELL - Customer (auth), Feedback, Likes (M:N), Complaint
   ===================================================================== */
 
-- ---------- Customer ----------
-- NOTE: password_hash values below are PLACEHOLDER bcrypt-style strings for
-- sample data only. Real accounts are created via Russell's /register endpoint,
-- which hashes the password with bcrypt. Never store plain-text passwords.
CREATE TABLE Customer (
    customer_id   INT IDENTITY(1,1) PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    created_at    DATETIME NOT NULL DEFAULT GETDATE()
);
 
INSERT INTO Customer (name, email, password_hash, phone) VALUES
('Alice Tan',   'alice@example.com',   '$2b$10$SamplePlaceholderHashReplaceMe000000000000000000001', '91234567'),
('Bob Lim',     'bob@example.com',     '$2b$10$SamplePlaceholderHashReplaceMe000000000000000000002', '98765432'),
('Charlie Ng',  'charlie@example.com', '$2b$10$SamplePlaceholderHashReplaceMe000000000000000000003', '90011223'),
('Divya Kumar', 'divya@example.com',   '$2b$10$SamplePlaceholderHashReplaceMe000000000000000000004', '92345678');
 
/* =====================================================================
   JUSTIN - Orders, OrderItem, Payment
   NOTE: table is named "Orders" because ORDER is a reserved SQL keyword.
   ===================================================================== */
 
-- ---------- Orders ----------
CREATE TABLE Orders (
    order_id       INT IDENTITY(1,1) PRIMARY KEY,
    customer_id    INT NOT NULL,
    stall_id       INT NOT NULL,
    order_datetime DATETIME NOT NULL DEFAULT GETDATE(),
    total_amount   DECIMAL(10,2) NOT NULL,
    status         VARCHAR(20) NOT NULL,   -- 'Preparing' / 'Completed' / 'Cancelled'
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (stall_id)    REFERENCES Stall(stall_id)
);
 
INSERT INTO Orders (customer_id, stall_id, order_datetime, total_amount, status) VALUES
(1, 1, '2026-07-01 12:30', 6.50,  'Completed'),
(2, 3, '2026-07-01 09:15', 4.60,  'Completed'),
(3, 4, '2026-07-02 15:00', 6.50,  'Completed'),
(1, 5, '2026-07-03 13:00', 5.00,  'Preparing'),
(4, 2, '2026-07-03 12:00', 13.50, 'Completed');
 
-- ---------- OrderItem (line items; each references a MenuItem) ----------
CREATE TABLE OrderItem (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id      INT NOT NULL,
    menu_item_id  INT NOT NULL,
    quantity      INT NOT NULL,
    subtotal      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id)     REFERENCES Orders(order_id),
    FOREIGN KEY (menu_item_id) REFERENCES MenuItem(menu_item_id)
);
 
INSERT INTO OrderItem (order_id, menu_item_id, quantity, subtotal) VALUES
(1, 1, 1, 4.50), (1, 3, 1, 2.00),                -- Order 1 = 6.50
(2, 7, 1, 1.80), (2, 6, 1, 1.20), (2, 8, 1, 1.60), -- Order 2 = 4.60
(3, 9, 1, 3.00), (3, 10, 1, 3.50),               -- Order 3 = 6.50
(4, 11, 1, 5.00),                                -- Order 4 = 5.00
(5, 4, 1, 6.50), (5, 5, 1, 7.00);                -- Order 5 = 13.50
 
-- ---------- Payment (one per order) ----------
CREATE TABLE Payment (
    payment_id       INT IDENTITY(1,1) PRIMARY KEY,
    order_id         INT NOT NULL UNIQUE,
    amount           DECIMAL(10,2) NOT NULL,
    payment_method   VARCHAR(20) NOT NULL,   -- 'Cash' / 'NETS' / 'PayNow'
    payment_status   VARCHAR(20) NOT NULL,   -- 'Success' / 'Pending' / 'Failed'
    payment_datetime DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);
 
INSERT INTO Payment (order_id, amount, payment_method, payment_status) VALUES
(1, 6.50,  'PayNow', 'Success'),
(2, 4.60,  'Cash',   'Success'),
(3, 6.50,  'NETS',   'Success'),
(4, 5.00,  'PayNow', 'Pending'),
(5, 13.50, 'NETS',   'Success');
 
/* =====================================================================
   RUSSELL (continued) - Feedback, Likes, Complaint
   ===================================================================== */
 
-- ---------- Feedback ----------
CREATE TABLE Feedback (
    feedback_id   INT IDENTITY(1,1) PRIMARY KEY,
    customer_id   INT NOT NULL,
    stall_id      INT NOT NULL,
    rating        INT NOT NULL,               -- 1 to 5
    comments      VARCHAR(500),
    feedback_date DATE NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (stall_id)    REFERENCES Stall(stall_id)
);
 
INSERT INTO Feedback (customer_id, stall_id, rating, comments, feedback_date) VALUES
(1, 1, 5, 'Best chicken rice in town, always fresh!',   '2026-07-01'),
(2, 3, 4, 'Crispy prata and quick service.',            '2026-07-01'),
(3, 4, 3, 'Chendol was a little too sweet for me.',     '2026-07-02');
 
-- ---------- Likes (M:N junction: Customer <-> MenuItem) ----------
CREATE TABLE Likes (
    customer_id  INT NOT NULL,
    menu_item_id INT NOT NULL,
    liked_at     DATETIME NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (customer_id, menu_item_id),
    FOREIGN KEY (customer_id)  REFERENCES Customer(customer_id),
    FOREIGN KEY (menu_item_id) REFERENCES MenuItem(menu_item_id)
);
 
INSERT INTO Likes (customer_id, menu_item_id) VALUES
(1, 1), (1, 11), (2, 6), (2, 8), (3, 9), (4, 4);
 
-- ---------- Complaint ----------
CREATE TABLE Complaint (
    complaint_id   INT IDENTITY(1,1) PRIMARY KEY,
    customer_id    INT NOT NULL,
    stall_id       INT NOT NULL,
    subject        VARCHAR(100) NOT NULL,
    description    VARCHAR(500),
    status         VARCHAR(20) NOT NULL,       -- 'Open' / 'Resolved'
    complaint_date DATE NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (stall_id)    REFERENCES Stall(stall_id)
);
 
INSERT INTO Complaint (customer_id, stall_id, subject, description, status, complaint_date) VALUES
(2, 5, 'Hygiene concern', 'Saw a fly near the cooking area.',    'Open',     '2026-07-02'),
(4, 2, 'Long wait time',  'Waited 30 minutes for my order.',     'Resolved', '2026-07-01');
 
/* =====================================================================
   ARRI (continued) - NEAOfficer, Inspection, HygieneGrade
   ===================================================================== */
 
-- ---------- NEAOfficer ----------
CREATE TABLE NEAOfficer (
    officer_id    INT IDENTITY(1,1) PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    badge_number  VARCHAR(20) NOT NULL UNIQUE,
    email         VARCHAR(100)
);
 
INSERT INTO NEAOfficer (name, badge_number, email) VALUES
('Lim Wei Sheng', 'NEA001', 'weisheng.lim@nea.gov.sg'),
('Nurul Aisyah',  'NEA002', 'nurul.aisyah@nea.gov.sg');
 
-- ---------- Inspection ----------
CREATE TABLE Inspection (
    inspection_id   INT IDENTITY(1,1) PRIMARY KEY,
    stall_id        INT NOT NULL,
    officer_id      INT NOT NULL,
    inspection_date DATE NOT NULL,
    score           INT NOT NULL,              -- 0 to 100
    remarks         VARCHAR(500),
    FOREIGN KEY (stall_id)   REFERENCES Stall(stall_id),
    FOREIGN KEY (officer_id) REFERENCES NEAOfficer(officer_id)
);
 
INSERT INTO Inspection (stall_id, officer_id, inspection_date, score, remarks) VALUES
(1, 1, '2025-12-10', 88, 'Good hygiene standards maintained.'),          -- older (history)
(1, 1, '2026-06-15', 92, 'Excellent hygiene, well-organised station.'),
(2, 1, '2026-06-15', 78, 'Minor issues with food storage temperature.'),
(3, 2, '2026-06-20', 85, 'Good overall cleanliness.'),
(5, 2, '2026-06-20', 65, 'Grease buildup near wok station, needs attention.');
 
-- ---------- HygieneGrade (a stall can have multiple over time) ----------
-- Grade guide: A >=85, B 70-84, C 50-69, D <50
CREATE TABLE HygieneGrade (
    hygiene_grade_id INT IDENTITY(1,1) PRIMARY KEY,
    stall_id         INT NOT NULL,
    inspection_id    INT NOT NULL,
    grade            CHAR(1) NOT NULL,          -- 'A' / 'B' / 'C' / 'D'
    valid_from       DATE NOT NULL,
    valid_until      DATE NOT NULL,
    FOREIGN KEY (stall_id)      REFERENCES Stall(stall_id),
    FOREIGN KEY (inspection_id) REFERENCES Inspection(inspection_id)
);
 
INSERT INTO HygieneGrade (stall_id, inspection_id, grade, valid_from, valid_until) VALUES
(1, 1, 'A', '2025-12-10', '2026-06-14'),   -- old grade for stall 1 (history)
(1, 2, 'A', '2026-06-15', '2027-06-14'),   -- current grade for stall 1
(2, 3, 'B', '2026-06-15', '2027-06-14'),
(3, 4, 'A', '2026-06-20', '2027-06-19'),
(5, 5, 'C', '2026-06-20', '2027-06-19');
GO
 
/* =====================================================================
   VERIFICATION - run these after executing the script above
   Each should return rows; the counts confirm sample data loaded.
   ===================================================================== */
SELECT 'HawkerCentre'    AS TableName, COUNT(*) AS Rows FROM HawkerCentre
UNION ALL SELECT 'Operator',        COUNT(*) FROM Operator
UNION ALL SELECT 'StallOwner',      COUNT(*) FROM StallOwner
UNION ALL SELECT 'Stall',           COUNT(*) FROM Stall
UNION ALL SELECT 'RentalAgreement', COUNT(*) FROM RentalAgreement
UNION ALL SELECT 'Cuisine',         COUNT(*) FROM Cuisine
UNION ALL SELECT 'MenuItem',        COUNT(*) FROM MenuItem
UNION ALL SELECT 'MenuItemCuisine', COUNT(*) FROM MenuItemCuisine
UNION ALL SELECT 'Promotion',       COUNT(*) FROM Promotion
UNION ALL SELECT 'Customer',        COUNT(*) FROM Customer
UNION ALL SELECT 'Orders',          COUNT(*) FROM Orders
UNION ALL SELECT 'OrderItem',       COUNT(*) FROM OrderItem
UNION ALL SELECT 'Payment',         COUNT(*) FROM Payment
UNION ALL SELECT 'Feedback',        COUNT(*) FROM Feedback
UNION ALL SELECT 'Likes',           COUNT(*) FROM Likes
UNION ALL SELECT 'Complaint',       COUNT(*) FROM Complaint
UNION ALL SELECT 'NEAOfficer',      COUNT(*) FROM NEAOfficer
UNION ALL SELECT 'Inspection',      COUNT(*) FROM Inspection
UNION ALL SELECT 'HygieneGrade',    COUNT(*) FROM HygieneGrade;
 
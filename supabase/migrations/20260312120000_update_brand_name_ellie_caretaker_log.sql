-- Update brand name to Ellie — Caretaker Log
INSERT INTO app_settings (key, value)
VALUES ('brand_name', 'Ellie — Caretaker Log')
ON CONFLICT (key) DO UPDATE SET value = 'Ellie — Caretaker Log';

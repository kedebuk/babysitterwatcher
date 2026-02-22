
-- Make all storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('child-photos', 'event-photos', 'inventory-photos');

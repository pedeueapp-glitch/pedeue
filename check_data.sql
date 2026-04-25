SELECT s.name as storeName, s.storeType as sType, c.name as catName, c.storeType as cType 
FROM category c 
JOIN store s ON c.storeId = s.id;

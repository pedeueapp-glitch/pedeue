-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: saas_delivery
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('16fca993-42af-4fd6-8338-6c39bcc4581b','9391c28f543c458e928e309a6c00be4e1e9a80400aef22d8a33d955f9f156a53','2026-04-22 17:46:42.047','20260422174641_init',NULL,NULL,'2026-04-22 17:46:41.074',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_log` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `resource` varchar(191) NOT NULL,
  `details` longtext DEFAULT NULL,
  `ip` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cashiersession`
--

DROP TABLE IF EXISTS `cashiersession`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cashiersession` (
  `id` varchar(191) NOT NULL,
  `storeId` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `openedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `closedAt` datetime(3) DEFAULT NULL,
  `openingBalance` double NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cashiersession_storeId_idx` (`storeId`),
  CONSTRAINT `cashiersession_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cashiersession`
--

LOCK TABLES `cashiersession` WRITE;
/*!40000 ALTER TABLE `cashiersession` DISABLE KEYS */;
INSERT INTO `cashiersession` VALUES ('cs_1776884252555','cmoach8dm0001i6tow1kihrmu','CLOSED','2026-04-22 18:57:32.555','2026-04-23 10:54:13.414',0,'2026-04-22 18:57:32.556','2026-04-23 10:54:13.414'),('cs_1776941655344','cmoach8dm0001i6tow1kihrmu','CLOSED','2026-04-23 10:54:15.344','2026-04-23 11:12:33.882',0,'2026-04-23 10:54:15.345','2026-04-23 11:12:33.882'),('cs_1776942768980','cmoach8dm0001i6tow1kihrmu','CLOSED','2026-04-23 11:12:48.980','2026-04-23 12:33:36.767',0,'2026-04-23 11:12:48.986','2026-04-23 12:33:36.767'),('cs_1776947619238','cmoach8dm0001i6tow1kihrmu','OPEN','2026-04-23 12:33:39.238',NULL,0,'2026-04-23 12:33:39.240','2026-04-23 12:33:39.238');
/*!40000 ALTER TABLE `cashiersession` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `emoji` varchar(191) DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `storeType` varchar(191) NOT NULL DEFAULT 'RESTAURANT',
  PRIMARY KEY (`id`),
  KEY `Category_storeId_fkey` (`storeId`),
  CONSTRAINT `Category_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES ('cat_2j1m2x7_1776882548750','PRESENTES','📄',0,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 18:29:08.753','2026-04-22 18:29:08.750','SERVICE'),('cat_lagj3k6_1776882271751','VESTIDOS','👗',0,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 18:24:31.754','2026-04-22 18:24:31.751','SHOWCASE'),('cmoach8dp0003i6tovnb1k251','Padaria','🥖',1,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.341','2026-04-22 17:46:47.339','RESTAURANT'),('cmoach8dr0005i6to1oldwxpv','Frios e Laticínios','🧀',2,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.343','2026-04-22 17:46:47.342','RESTAURANT'),('cmoach8ds0007i6tooftn9wr9','Bebidas','🥤',3,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.345','2026-04-22 17:46:47.343','RESTAURANT'),('cmoach8du0009i6tol27a8z6g','Hortifruti','🥬',4,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.346','2026-04-22 17:46:47.345','RESTAURANT'),('cmoach8dw000bi6totyen7txa','Mercearia','🛒',5,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.348','2026-04-22 17:46:47.347','RESTAURANT');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon`
--

DROP TABLE IF EXISTS `coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon` (
  `id` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `value` double NOT NULL,
  `minOrderValue` double NOT NULL DEFAULT 0,
  `maxUses` int(11) NOT NULL DEFAULT 0,
  `usedCount` int(11) NOT NULL DEFAULT 0,
  `expiryDate` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `isCashback` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupon_code_storeId_key` (`code`,`storeId`),
  KEY `coupon_storeId_idx` (`storeId`),
  CONSTRAINT `coupon_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon`
--

LOCK TABLES `coupon` WRITE;
/*!40000 ALTER TABLE `coupon` DISABLE KEYS */;
INSERT INTO `coupon` VALUES ('cup_1776941430100','CARLOS10','PERCENT',10,20,0,0,NULL,1,'cmoach8dm0001i6tow1kihrmu','2026-04-23 10:50:30.100','2026-04-23 10:50:37.622',0);
/*!40000 ALTER TABLE `coupon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `street` varchar(191) DEFAULT NULL,
  `number` varchar(191) DEFAULT NULL,
  `complement` varchar(191) DEFAULT NULL,
  `neighborhood` varchar(191) DEFAULT NULL,
  `reference` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_phone_storeId_key` (`phone`,`storeId`),
  KEY `Customer_phone_idx` (`phone`),
  KEY `Customer_storeId_fkey` (`storeId`),
  CONSTRAINT `Customer_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES ('31d61c90-48a6-4db7-aeb9-0ed2761710a4','Carlos Henrique','82988905667','Rua 25 de Agosto','14',NULL,'Centro',NULL,'Joaquim Gomes',NULL,'cmoach8dm0001i6tow1kihrmu','2026-04-22 18:28:20.367','2026-04-22 18:28:20.366');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliveryarea`
--

DROP TABLE IF EXISTS `deliveryarea`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deliveryarea` (
  `id` varchar(191) NOT NULL,
  `neighborhood` varchar(191) NOT NULL,
  `fee` double NOT NULL DEFAULT 0,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `DeliveryArea_storeId_fkey` (`storeId`),
  CONSTRAINT `DeliveryArea_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveryarea`
--

LOCK TABLES `deliveryarea` WRITE;
/*!40000 ALTER TABLE `deliveryarea` DISABLE KEYS */;
INSERT INTO `deliveryarea` VALUES ('area_alqrun7z_1776941359941','TERRENOS',3,'cmoach8dm0001i6tow1kihrmu','2026-04-23 10:49:19.943','2026-04-23 10:49:19.941'),('area_gclydhmn_1776941364751','CASAL',2,'cmoach8dm0001i6tow1kihrmu','2026-04-23 10:49:24.753','2026-04-23 10:49:24.751'),('area_rti4x7o8_1776941369858','MATADOURO',3,'cmoach8dm0001i6tow1kihrmu','2026-04-23 10:49:29.860','2026-04-23 10:49:29.858'),('area_tb8ugx8a_1776941354231','CENTRO',0,'cmoach8dm0001i6tow1kihrmu','2026-04-23 10:49:14.233','2026-04-23 10:49:14.231'),('area_wrs46sgo_1776941380630','ASPLANAS',2,'cmoach8dm0001i6tow1kihrmu','2026-04-23 10:49:40.631','2026-04-23 10:49:40.630'),('area_wzv93fy2_1776941387691','CACIMBAS',3,'cmoach8dm0001i6tow1kihrmu','2026-04-23 10:49:47.692','2026-04-23 10:49:47.691');
/*!40000 ALTER TABLE `deliveryarea` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver`
--

DROP TABLE IF EXISTS `driver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `driver` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `vehicle` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Driver_storeId_fkey` (`storeId`),
  CONSTRAINT `Driver_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver`
--

LOCK TABLES `driver` WRITE;
/*!40000 ALTER TABLE `driver` DISABLE KEYS */;
INSERT INTO `driver` VALUES ('mot_rrr9c9tn_1776887299112','CARLOS','','',1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 19:48:19.114','2026-04-23 11:30:52.528');
/*!40000 ALTER TABLE `driver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `purchasePrice` double NOT NULL DEFAULT 0,
  `profitMargin` double NOT NULL DEFAULT 0,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `material_storeId_idx` (`storeId`),
  CONSTRAINT `material_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material`
--

LOCK TABLES `material` WRITE;
/*!40000 ALTER TABLE `material` DISABLE KEYS */;
INSERT INTO `material` VALUES ('cmoagl7bo0001i6l4bgaetgzx','Papel Glossy 180g',50,17,50,'cmoach8dm0001i6tow1kihrmu','2026-04-22 19:41:51.060','2026-04-22 19:42:26.278'),('cmoaglv1e0003i6l4g4808tdz','Papel Adesivo',50,33,50,'cmoach8dm0001i6tow1kihrmu','2026-04-22 19:42:21.795','2026-04-22 19:42:21.795');
/*!40000 ALTER TABLE `material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `option`
--

DROP TABLE IF EXISTS `option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `option` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `price` double NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `optionGroupId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Option_optionGroupId_fkey` (`optionGroupId`),
  CONSTRAINT `Option_optionGroupId_fkey` FOREIGN KEY (`optionGroupId`) REFERENCES `optiongroup` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `option`
--

LOCK TABLES `option` WRITE;
/*!40000 ALTER TABLE `option` DISABLE KEYS */;
INSERT INTO `option` VALUES ('opti_0s62jvs_1776997983429','a',2,1,'optg_tecugn4_1776997980241','2026-04-24 02:33:03.431','2026-04-24 02:33:03.429'),('opti_7t38z3m_1776997975013','A',3,1,'optg_mwd2ybh_1776997964402','2026-04-24 02:32:55.014','2026-04-24 02:32:55.013'),('opti_t6nfqz1_1776997970073','Teste2',2,1,'optg_mwd2ybh_1776997964402','2026-04-24 02:32:50.074','2026-04-24 02:32:50.073');
/*!40000 ALTER TABLE `option` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `optiongroup`
--

DROP TABLE IF EXISTS `optiongroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `optiongroup` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `minOptions` int(11) NOT NULL DEFAULT 0,
  `maxOptions` int(11) NOT NULL DEFAULT 1,
  `isRequired` tinyint(1) NOT NULL DEFAULT 0,
  `productId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `priceCalculation` enum('SUM','HIGHEST','AVERAGE') NOT NULL DEFAULT 'SUM',
  PRIMARY KEY (`id`),
  KEY `OptionGroup_productId_fkey` (`productId`),
  CONSTRAINT `OptionGroup_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `optiongroup`
--

LOCK TABLES `optiongroup` WRITE;
/*!40000 ALTER TABLE `optiongroup` DISABLE KEYS */;
INSERT INTO `optiongroup` VALUES ('optg_mwd2ybh_1776997964402','Opcionais',0,1,0,'agua-1-5l-id','2026-04-24 02:32:44.403','2026-04-24 02:32:44.402','SUM'),('optg_tecugn4_1776997980241','A',1,1,1,'agua-1-5l-id','2026-04-24 02:33:00.243','2026-04-24 02:33:00.241','SUM');
/*!40000 ALTER TABLE `optiongroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order` (
  `id` varchar(191) NOT NULL,
  `orderNumber` int(11) NOT NULL AUTO_INCREMENT,
  `customerName` varchar(191) NOT NULL,
  `customerPhone` varchar(191) NOT NULL,
  `paymentMethod` varchar(191) NOT NULL,
  `observations` text DEFAULT NULL,
  `total` double NOT NULL,
  `subtotal` double DEFAULT NULL,
  `discount` double DEFAULT NULL,
  `status` enum('PENDING','ACCEPTED','PREPARING','DELIVERING','DONE','DELIVERED','CANCELED') NOT NULL DEFAULT 'PENDING',
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `driverId` varchar(191) DEFAULT NULL,
  `change` double DEFAULT NULL,
  `complement` varchar(191) DEFAULT NULL,
  `customerId` varchar(191) DEFAULT NULL,
  `deliveryFee` double NOT NULL DEFAULT 0,
  `deliveryType` varchar(191) NOT NULL DEFAULT 'DELIVERY',
  `neighborhood` varchar(191) DEFAULT NULL,
  `number` varchar(191) DEFAULT NULL,
  `reference` varchar(191) DEFAULT NULL,
  `street` varchar(191) DEFAULT NULL,
  `orderType` enum('DELIVERY','PICKUP','DINING_IN','RETAIL','SERVICE') NOT NULL DEFAULT 'DELIVERY',
  `tableId` varchar(191) DEFAULT NULL,
  `waiterId` varchar(191) DEFAULT NULL,
  `deliveryDeadline` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_orderNumber_key` (`orderNumber`),
  KEY `Order_customerId_fkey` (`customerId`),
  KEY `Order_driverId_fkey` (`driverId`),
  KEY `Order_storeId_fkey` (`storeId`),
  KEY `Order_tableId_fkey` (`tableId`),
  KEY `Order_waiterId_fkey` (`waiterId`),
  CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `driver` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Order_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_waiterId_fkey` FOREIGN KEY (`waiterId`) REFERENCES `waiter` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES ('ord_8dp1uj3_1777000140970',17,'Carlos Henrique','82988905667','pix',NULL,45,NULL,NULL,'PENDING','cmoach8dm0001i6tow1kihrmu','2026-04-24 03:09:00.972','2026-04-24 03:09:00.970',NULL,NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',3,'DELIVERY','TERRENOS','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_8fuc244_1776885356530',5,'Carlos Henrique','82988905667','cartão',NULL,11.4,NULL,NULL,'DELIVERED','cmoach8dm0001i6tow1kihrmu','2026-04-22 19:15:56.531','2026-04-23 10:41:36.730','mot_rrr9c9tn_1776887299112',NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'PICKUP','Centro','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_cpxjtlv_1776946640294',10,'Carlos Henrique','82988905667','cartão',NULL,18,NULL,NULL,'PENDING','cmoach8dm0001i6tow1kihrmu','2026-04-23 12:17:20.305','2026-04-23 12:17:20.294',NULL,NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'DELIVERY','CENTRO','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_e68ccjc_1776948733605',14,'Carlos Henrique','82988905667','pix',NULL,40,NULL,NULL,'DELIVERING','cmoach8dm0001i6tow1kihrmu','2026-04-23 12:52:13.606','2026-04-23 13:02:04.227','mot_rrr9c9tn_1776887299112',NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'DELIVERY','CENTRO','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_elnc0j6_1776945020643',9,'Carlos Henrique','82988905667','pix','Quero sem cebola',40,NULL,NULL,'PENDING','cmoach8dm0001i6tow1kihrmu','2026-04-23 11:50:20.644','2026-04-23 11:50:20.643',NULL,NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'DELIVERY','CENTRO','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_fodwjsq_1776885674632',6,'Carlos Henrique','82988905667','pix',NULL,32.9,NULL,NULL,'DELIVERED','cmoach8dm0001i6tow1kihrmu','2026-04-22 19:21:14.633','2026-04-23 10:41:33.552','mot_rrr9c9tn_1776887299112',NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'PICKUP','Centro','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_hwjai0d_1776887322338',7,'Consumo Local','00000000000','DINHEIRO',NULL,25.9,25.9,0,'DELIVERED','cmoach8dm0001i6tow1kihrmu','2026-04-22 19:48:42.340','2026-04-23 10:41:22.845',NULL,NULL,NULL,NULL,0,'PICKUP',NULL,NULL,NULL,NULL,'DINING_IN','table_gmd3lfl_1776885088071','waiter_236r4js_1776885093963',NULL),('ord_id2cczm_1776948337374',13,'Carlos Henrique','82988905667','pix',NULL,40,NULL,NULL,'PENDING','cmoach8dm0001i6tow1kihrmu','2026-04-23 12:45:37.376','2026-04-23 12:45:37.374',NULL,NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'DELIVERY','CENTRO','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_ikg4okd_1776942808792',8,'Carlos Henrique','82988905667','pix',NULL,68.8,NULL,NULL,'DELIVERING','cmoach8dm0001i6tow1kihrmu','2026-04-23 11:13:28.794','2026-04-23 11:38:20.213','mot_rrr9c9tn_1776887299112',NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',3,'DELIVERY','TERRENOS','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_omnfmlk_1776947580961',12,'Venda Balcão','','CARTAO DE DEBITO',NULL,20,20,0,'DONE','cmoach8dm0001i6tow1kihrmu','2026-04-23 12:33:00.963','2026-04-23 12:33:00.961',NULL,NULL,NULL,NULL,0,'DELIVERY',NULL,NULL,NULL,NULL,'RETAIL',NULL,NULL,NULL),('ord_t5mmozv_1776946927600',11,'Carlos Henrique','82988905667','pix',NULL,18,NULL,NULL,'PENDING','cmoach8dm0001i6tow1kihrmu','2026-04-23 12:22:07.602','2026-04-23 12:22:07.600',NULL,NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'DELIVERY','CENTRO','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_to1jeoo_1776948890628',15,'Carlos Henrique','82988905667','pix',NULL,42,NULL,NULL,'DELIVERED','cmoach8dm0001i6tow1kihrmu','2026-04-23 12:54:50.630','2026-04-24 03:07:39.240','mot_rrr9c9tn_1776887299112',NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',2,'DELIVERY','ASPLANAS','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL),('ord_u17ojrl_1776885102659',3,'Consumo Local','00000000000','PIX',NULL,18,18,0,'DELIVERED','cmoach8dm0001i6tow1kihrmu','2026-04-22 19:11:42.660','2026-04-23 10:41:43.586',NULL,NULL,NULL,NULL,0,'PICKUP',NULL,NULL,NULL,NULL,'DINING_IN','table_gmd3lfl_1776885088071','waiter_236r4js_1776885093963',NULL),('ord_wssfzhm_1776996778764',16,'Venda Balcão','','CARTAO DE CREDITO',NULL,10,10,0,'DONE','cmoach8dm0001i6tow1kihrmu','2026-04-24 02:12:58.766','2026-04-24 02:12:58.764',NULL,NULL,NULL,NULL,0,'DELIVERY',NULL,NULL,NULL,NULL,'RETAIL',NULL,NULL,NULL),('ord_yd6bvdl_1776885285973',4,'Carlos Henrique','82988905667','pix',NULL,8.9,NULL,NULL,'DELIVERED','cmoach8dm0001i6tow1kihrmu','2026-04-22 19:14:45.975','2026-04-23 10:41:39.755','mot_rrr9c9tn_1776887299112',NULL,NULL,'31d61c90-48a6-4db7-aeb9-0ed2761710a4',0,'PICKUP','Centro','14',NULL,'Rua 25 de Agosto','DELIVERY',NULL,NULL,NULL);
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderitem`
--

DROP TABLE IF EXISTS `orderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orderitem` (
  `id` varchar(191) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` double NOT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `productId` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `choices` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderItem_orderId_fkey` (`orderId`),
  KEY `OrderItem_productId_fkey` (`productId`),
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
INSERT INTO `orderitem` VALUES ('item_32sokpx_1776887322338',1,7.9,'','tomate-id','ord_hwjai0d_1776887322338',NULL),('item_43zejoa_1776996778764',1,10,NULL,'prod_l8kjdoh_1776886472873','ord_wssfzhm_1776996778764','[\"\"]'),('item_7qiecag_1776946640294',1,18,NULL,'cerveja-id','ord_cpxjtlv_1776946640294','[]'),('item_80zscfs_1776945020643',1,40,'Combo: COMBO FAMILIA + Cerveja Artesanal 600ml + Tomate Italiano 1kg + Alface Crespa | Valor individual somado: R$ 91.70 ','agua-1-5l-id','ord_elnc0j6_1776945020643','[]'),('item_84d4wbe_1776946927600',1,18,NULL,'cerveja-id','ord_t5mmozv_1776946927600','[]'),('item_9lnksyn_1776885674632',1,32.9,'Combo: Água Mineral 1,5L + Cerveja Artesanal 600ml + Tomate Italiano 1kg + Alface Crespa | Valor individual somado: R$ 62.30 ','agua-1-5l-id','ord_fodwjsq_1776885674632','[]'),('item_9qkr8up_1776885102659',1,18,'','cerveja-id','ord_u17ojrl_1776885102659',NULL),('item_c21aalc_1776885285973',1,8.9,NULL,'feijao-1kg-id','ord_yd6bvdl_1776885285973','[]'),('item_dd8ao5k_1776885356530',1,7.9,NULL,'tomate-id','ord_8fuc244_1776885356530','[]'),('item_fhidf9c_1776947580961',1,10,NULL,'prod_l8kjdoh_1776886472873','ord_omnfmlk_1776947580961','[\"\"]'),('item_frezhja_1776887322338',1,18,'','cerveja-id','ord_hwjai0d_1776887322338',NULL),('item_g72k9yu_1776942808793',2,32.9,'Combo: Água Mineral 1,5L + Cerveja Artesanal 600ml + Tomate Italiano 1kg + Alface Crespa | Valor individual somado: R$ 62.30 ','agua-1-5l-id','ord_ikg4okd_1776942808792','[]'),('item_mao6a2n_1776948733605',1,40,'Combo: COMBO FAMILIA + Cerveja Artesanal 600ml + Tomate Italiano 1kg + Alface Crespa | Valor individual somado: R$ 91.70 ','agua-1-5l-id','ord_e68ccjc_1776948733605','[]'),('item_pzi2syf_1776947580961',1,10,NULL,'prod_l8kjdoh_1776886472873','ord_omnfmlk_1776947580961','[\"\"]'),('item_tflltb6_1777000140970',1,42,'Combo: COMBO FAMILIA + Cerveja Artesanal 600ml + Tomate Italiano 1kg + Alface Crespa | Opcionais: a','agua-1-5l-id','ord_8dp1uj3_1777000140970','[{\"id\":\"opti_0s62jvs_1776997983429\",\"name\":\"a\",\"price\":2,\"isActive\":true,\"optionGroupId\":\"optg_tecugn4_1776997980241\",\"createdAt\":\"2026-04-24T02:33:03.431Z\",\"updatedAt\":\"2026-04-24T02:33:03.429Z\"}]'),('item_tlkwvwo_1776948337374',1,40,'Combo: COMBO FAMILIA + Cerveja Artesanal 600ml + Tomate Italiano 1kg + Alface Crespa | Valor individual somado: R$ 91.70 ','agua-1-5l-id','ord_id2cczm_1776948337374','[]'),('item_wxbqj5a_1776885356530',1,3.5,NULL,'alface-id','ord_8fuc244_1776885356530','[]'),('item_z5ly0e8_1776948890629',1,40,'Combo: COMBO FAMILIA + Cerveja Artesanal 600ml + Tomate Italiano 1kg + Alface Crespa | Valor individual somado: R$ 91.70 ','agua-1-5l-id','ord_to1jeoo_1776948890628','[]');
/*!40000 ALTER TABLE `orderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pdvsettings`
--

DROP TABLE IF EXISTS `pdvsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdvsettings` (
  `id` varchar(191) NOT NULL,
  `storeId` varchar(191) NOT NULL,
  `soundEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `autoPrint` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `notificationSound` varchar(191) NOT NULL DEFAULT 'notification.mp3',
  PRIMARY KEY (`id`),
  UNIQUE KEY `pdvsettings_storeId_key` (`storeId`),
  CONSTRAINT `pdvsettings_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pdvsettings`
--

LOCK TABLES `pdvsettings` WRITE;
/*!40000 ALTER TABLE `pdvsettings` DISABLE KEYS */;
INSERT INTO `pdvsettings` VALUES ('pdvset_1776880308746','cmoach8dm0001i6tow1kihrmu',1,1,'2026-04-22 17:51:48.747','2026-04-22 19:15:29.970','notification.mp3');
/*!40000 ALTER TABLE `pdvsettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plan`
--

DROP TABLE IF EXISTS `plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plan` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `price` double NOT NULL,
  `maxProducts` int(11) NOT NULL DEFAULT 20,
  `features` longtext DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan`
--

LOCK TABLES `plan` WRITE;
/*!40000 ALTER TABLE `plan` DISABLE KEYS */;
INSERT INTO `plan` VALUES ('702ce90a-2737-4ab9-905a-bf03295ac1f0','PLANO PROFISSIONAL','',89,500,'{\"PDV_SYSTEM\":true,\"TABLE_MANAGEMENT\":true,\"DIGITAL_MENU\":true,\"WAITER_APP\":true,\"DELIVERY_SYSTEM\":true,\"COUPON_SYSTEM\":true,\"AUTO_PRINT\":true}',1,'2026-04-22 17:51:15.604','2026-04-22 17:51:15.603'),('de53389d-21e6-491b-9476-3a11007e3f70','PLANO BÁSICO','',1,100,'{\"PDV_SYSTEM\":true,\"TABLE_MANAGEMENT\":false,\"DIGITAL_MENU\":true,\"WAITER_APP\":false,\"DELIVERY_SYSTEM\":true,\"COUPON_SYSTEM\":false,\"AUTO_PRINT\":true}',1,'2026-04-22 17:50:57.787','2026-04-24 02:09:45.766');
/*!40000 ALTER TABLE `plan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platform_expense`
--

DROP TABLE IF EXISTS `platform_expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `platform_expense` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `type` varchar(191) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_expense`
--

LOCK TABLES `platform_expense` WRITE;
/*!40000 ALTER TABLE `platform_expense` DISABLE KEYS */;
/*!40000 ALTER TABLE `platform_expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platform_transaction`
--

DROP TABLE IF EXISTS `platform_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `platform_transaction` (
  `id` varchar(191) NOT NULL,
  `storeId` varchar(191) NOT NULL,
  `planId` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'pending',
  `paymentMethod` varchar(191) DEFAULT NULL,
  `externalId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `months` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `platform_transaction_externalId_key` (`externalId`),
  KEY `platform_transaction_storeId_fkey` (`storeId`),
  CONSTRAINT `platform_transaction_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_transaction`
--

LOCK TABLES `platform_transaction` WRITE;
/*!40000 ALTER TABLE `platform_transaction` DISABLE KEYS */;
INSERT INTO `platform_transaction` VALUES ('cmoc9rhfy0001i6bwxqxd92uf','cmoach8dm0001i6tow1kihrmu','de53389d-21e6-491b-9476-3a11007e3f70',69,'pending','pix','7ef29dd523a247428b5194376636c188','2026-04-24 02:06:19.150','2026-04-24 02:06:19.150',1),('cmoc9suo90003i6bwv2xddio0','cmoach8dm0001i6tow1kihrmu','de53389d-21e6-491b-9476-3a11007e3f70',69,'pending','pix','67cb6b1b4af24c04ac379518644d59d2','2026-04-24 02:07:22.953','2026-04-24 02:07:22.953',1),('cmoc9uu3y0005i6bwrlp3kwhq','cmoach8dm0001i6tow1kihrmu','de53389d-21e6-491b-9476-3a11007e3f70',69,'pending','pix','afae9ff69c1343bb904fd9fc3409ebfc','2026-04-24 02:08:55.534','2026-04-24 02:08:55.534',1),('cmoc9x59z0007i6bwebmbljby','cmoach8dm0001i6tow1kihrmu','de53389d-21e6-491b-9476-3a11007e3f70',1,'pending','pix','1322140708914403b9c70f38a182b5bf','2026-04-24 02:10:43.319','2026-04-24 02:10:43.319',1),('cmoc9zc280009i6bw4y7k56g1','cmoach8dm0001i6tow1kihrmu','de53389d-21e6-491b-9476-3a11007e3f70',1,'pending','pix','a0247cc93d7b46989c0c0305f1c25c97','2026-04-24 02:12:25.425','2026-04-24 02:12:25.425',1),('cmoca6z2k000bi6bwlm4j7bvs','cmoach8dm0001i6tow1kihrmu','702ce90a-2737-4ab9-905a-bf03295ac1f0',89,'pending','pix','262d7e5f54fd4735a875669f5744455b','2026-04-24 02:18:21.837','2026-04-24 04:14:40.122',1),('cmocaayff000fi6bweja4ym3k','cmoach8dm0001i6tow1kihrmu','702ce90a-2737-4ab9-905a-bf03295ac1f0',1281.6,'pending','pix','4ee4557a74e64969852e8cf5f4951f62','2026-04-24 02:21:27.627','2026-04-24 04:16:36.307',24);
/*!40000 ALTER TABLE `platform_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platformcity`
--

DROP TABLE IF EXISTS `platformcity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `platformcity` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `state` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platformcity`
--

LOCK TABLES `platformcity` WRITE;
/*!40000 ALTER TABLE `platformcity` DISABLE KEYS */;
/*!40000 ALTER TABLE `platformcity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `price` double NOT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `inStock` tinyint(1) NOT NULL DEFAULT 1,
  `barcode` varchar(191) DEFAULT NULL,
  `productType` varchar(191) NOT NULL DEFAULT 'RESTAURANT',
  `position` int(11) NOT NULL DEFAULT 0,
  `categoryId` varchar(191) NOT NULL,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `comboConfig` longtext DEFAULT NULL,
  `isCombo` tinyint(1) NOT NULL DEFAULT 0,
  `salePrice` double DEFAULT NULL,
  `profitMargin` double NOT NULL DEFAULT 0,
  `purchasePrice` double NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Product_categoryId_fkey` (`categoryId`),
  KEY `Product_storeId_fkey` (`storeId`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Product_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES ('agua-1-5l-id','COMBO FAMILIA','',62.3,NULL,1,1,NULL,'RESTAURANT',3,'cmoach8ds0007i6tooftn9wr9','cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.354','2026-04-23 11:02:04.106','[\"agua-1-5l-id\",\"cerveja-id\",\"tomate-id\",\"alface-id\"]',1,40,0,0),('alface-id','Alface Crespa','Alface crespa fresca, lavada e higienizada.',3.5,NULL,1,1,NULL,'RESTAURANT',2,'cmoach8du0009i6tol27a8z6g','cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.355','2026-04-22 17:46:47.355',NULL,0,NULL,0,0),('arroz-5kg-id','Arroz Branco 5kg','Arroz branco tipo 1, polido, grãos selecionados. Embalagem 5kg.',24.9,NULL,1,1,NULL,'RESTAURANT',1,'cmoach8dw000bi6totyen7txa','cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.357','2026-04-22 17:46:47.357',NULL,0,NULL,0,0),('cerveja-id','Cerveja Artesanal 600ml','Cerveja artesanal IPA gelada. Garrafa 600ml.',18,NULL,1,1,NULL,'RESTAURANT',4,'cmoach8ds0007i6tooftn9wr9','cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.354','2026-04-22 17:46:47.354',NULL,0,NULL,0,0),('feijao-1kg-id','Feijão Carioca 1kg','Feijão carioca tipo 1, grãos graúdos e sadios. 1kg.',8.9,NULL,1,1,NULL,'RESTAURANT',2,'cmoach8dw000bi6totyen7txa','cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.357','2026-04-22 17:46:47.357',NULL,0,NULL,0,0),('prod_l8kjdoh_1776886472873','VESTIDO BONITO','',20,'/api/images?file=db02e70e-0d0f-4c38-8316-8dcfd102fcce.webp',1,1,'12','SHOWCASE',1,'cat_lagj3k6_1776882271751','cmoach8dm0001i6tow1kihrmu','2026-04-22 19:34:32.875','2026-04-22 20:06:38.618','[]',0,10,0,0),('prod_sjxcqjh_1776999416130','Buque','',35,'/api/images?file=support/2be630a4-67b9-4924-b129-642e5deb271a.webp',1,1,NULL,'SERVICE',1,'cat_2j1m2x7_1776882548750','cmoach8dm0001i6tow1kihrmu','2026-04-24 02:56:56.132','2026-04-24 02:57:03.861','[]',0,NULL,60,22),('tomate-id','Tomate Italiano 1kg','Tomate italiano selecionado, firme e saboroso. 1kg.',7.9,NULL,1,1,NULL,'RESTAURANT',1,'cmoach8du0009i6tol27a8z6g','cmoach8dm0001i6tow1kihrmu','2026-04-22 17:46:47.355','2026-04-22 17:46:47.355',NULL,0,NULL,0,0);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variant`
--

DROP TABLE IF EXISTS `product_variant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_variant` (
  `id` varchar(191) NOT NULL,
  `productId` varchar(191) NOT NULL,
  `color` varchar(191) NOT NULL,
  `colorHex` varchar(191) NOT NULL DEFAULT '#000000',
  `sizes` longtext NOT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `barcode` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_variant_productId_idx` (`productId`),
  CONSTRAINT `product_variant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variant`
--

LOCK TABLES `product_variant` WRITE;
/*!40000 ALTER TABLE `product_variant` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store`
--

DROP TABLE IF EXISTS `store`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `store` (
  `id` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `coverImage` varchar(191) DEFAULT NULL,
  `whatsapp` varchar(191) NOT NULL,
  `address` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `deliveryFee` double NOT NULL DEFAULT 0,
  `minOrderValue` double NOT NULL DEFAULT 0,
  `isOpen` tinyint(1) NOT NULL DEFAULT 1,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `primaryColor` varchar(191) NOT NULL DEFAULT '#f97316',
  `openingHours` longtext DEFAULT NULL,
  `showcaseBanners` longtext DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `deliveryTime` varchar(191) DEFAULT '30-45',
  `storeType` varchar(191) NOT NULL DEFAULT 'RESTAURANT',
  `restaurantBanners` longtext DEFAULT NULL,
  `serviceBanners` longtext DEFAULT NULL,
  `facebookPixelId` varchar(191) DEFAULT NULL,
  `googleAnalyticsId` varchar(191) DEFAULT NULL,
  `googleTagManagerId` varchar(191) DEFAULT NULL,
  `tiktokPixelId` varchar(191) DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Store_slug_key` (`slug`),
  UNIQUE KEY `Store_userId_key` (`userId`),
  CONSTRAINT `Store_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store`
--

LOCK TABLES `store` WRITE;
/*!40000 ALTER TABLE `store` DISABLE KEYS */;
INSERT INTO `store` VALUES ('cmoach8dm0001i6tow1kihrmu','shallom-supermercado','Shallom Supermercado e Padaria','Seu supermercado e padaria de confiança com os melhores produtos frescos e artesanais da cidade.','/api/images?file=support/b38b918e-e3a9-4b7a-9ec2-e6ac210896ad.png','/api/images?file=support/a659d859-6c5f-426f-9191-ee1d426bba9a.png','5582988905667','Rua das Flores, 123','São Paulo','SP',5,20,1,0,'#575799','[{\"day\":\"Segunda\",\"enabled\":true,\"open\":\"00:00\",\"close\":\"01:00\"},{\"day\":\"Terça\",\"enabled\":true,\"open\":\"00:00\",\"close\":\"01:00\"},{\"day\":\"Quarta\",\"enabled\":true,\"open\":\"00:00\",\"close\":\"01:00\"},{\"day\":\"Quinta\",\"enabled\":true,\"open\":\"00:00\",\"close\":\"01:00\"},{\"day\":\"Sexta\",\"enabled\":true,\"open\":\"00:00\",\"close\":\"01:00\"},{\"day\":\"Sábado\",\"enabled\":true,\"open\":\"00:00\",\"close\":\"01:00\"},{\"day\":\"Domingo\",\"enabled\":true,\"open\":\"00:00\",\"close\":\"01:00\"}]','[]','demo_user_id','2026-04-22 17:46:47.338','2026-04-24 04:16:49.047','30-45','SHOWCASE','null','null','','','','','10133878481');
/*!40000 ALTER TABLE `store` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription`
--

DROP TABLE IF EXISTS `subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription` (
  `id` varchar(191) NOT NULL,
  `status` enum('ACTIVE','CANCELED','PAST_DUE','TRIALING') NOT NULL DEFAULT 'ACTIVE',
  `expiresAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `lastPaymentAt` datetime(3) DEFAULT NULL,
  `planId` varchar(191) NOT NULL,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `lastPaymentId` varchar(191) DEFAULT NULL,
  `pendingPlanId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Subscription_storeId_key` (`storeId`),
  KEY `Subscription_planId_fkey` (`planId`),
  CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plan` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Subscription_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription`
--

LOCK TABLES `subscription` WRITE;
/*!40000 ALTER TABLE `subscription` DISABLE KEYS */;
INSERT INTO `subscription` VALUES ('b69dc2b2-25f2-4835-90df-1caea8c4e0fc','ACTIVE','2026-04-25 02:27:58.090',NULL,'702ce90a-2737-4ab9-905a-bf03295ac1f0','cmoach8dm0001i6tow1kihrmu','2026-04-22 17:51:19.828','2026-04-24 02:27:58.090','4ee4557a74e64969852e8cf5f4951f62','702ce90a-2737-4ab9-905a-bf03295ac1f0');
/*!40000 ALTER TABLE `subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_message`
--

DROP TABLE IF EXISTS `support_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_message` (
  `id` varchar(191) NOT NULL,
  `ticketId` varchar(191) NOT NULL,
  `senderId` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `attachmentUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `support_message_ticketId_idx` (`ticketId`),
  KEY `support_message_senderId_idx` (`senderId`),
  CONSTRAINT `support_message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `support_message_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_ticket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_message`
--

LOCK TABLES `support_message` WRITE;
/*!40000 ALTER TABLE `support_message` DISABLE KEYS */;
INSERT INTO `support_message` VALUES ('cmoawlizw0003i6mwdoju1xn8','cmoawlizw0001i6mw5p13jcvq','demo_user_id','Voce pode me ajudar',NULL,'2026-04-23 03:10:00.042'),('cmoawnrfo0001i64gdqvdxeti','cmoawlizw0001i6mw5p13jcvq','demo_user_id','Ola',NULL,'2026-04-23 03:11:44.292'),('cmoawnzfc0003i64g8jg35btk','cmoawlizw0001i6mw5p13jcvq','demo_user_id','Oi',NULL,'2026-04-23 03:11:54.648'),('cmoawsxv40005i64g336zguxw','cmoawlizw0001i6mw5p13jcvq','demo_user_id','Opa',NULL,'2026-04-23 03:15:45.905'),('cmoawt2mp0007i64gu2pp39d3','cmoawlizw0001i6mw5p13jcvq','demo_user_id','ola',NULL,'2026-04-23 03:15:52.082'),('cmoawtogm0009i64guxs3t5fe','cmoawlizw0001i6mw5p13jcvq','demo_user_id','','/uploads/support/5a479c97-7d36-4362-b4fb-a7544a65c911.png','2026-04-23 03:16:20.374'),('cmoaxln3y0001i6qo3otulay7','cmoawlizw0001i6mw5p13jcvq','demo_user_id','Ola',NULL,'2026-04-23 03:38:04.991'),('cmoaxlvj80003i6qoi6upywef','cmoawlizw0001i6mw5p13jcvq','demo_user_id','Opa',NULL,'2026-04-23 03:38:15.909'),('cmoaxm9ue0001i6wo72nb1kyy','cmoawlizw0001i6mw5p13jcvq','demo_user_id','teste',NULL,'2026-04-23 03:38:34.455'),('cmoaxmdro0003i6wo61pdg1si','cmoawlizw0001i6mw5p13jcvq','demo_user_id','teste',NULL,'2026-04-23 03:38:39.541'),('cmoaxngcd0005i6wocraabt11','cmoawlizw0001i6mw5p13jcvq','superadmin_id','Oi ola',NULL,'2026-04-23 03:39:29.533');
/*!40000 ALTER TABLE `support_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_ticket`
--

DROP TABLE IF EXISTS `support_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_ticket` (
  `id` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `status` enum('OPEN','IN_PROGRESS','CLOSED') NOT NULL DEFAULT 'OPEN',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `userId` varchar(191) NOT NULL,
  `storeId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `support_ticket_userId_idx` (`userId`),
  KEY `support_ticket_storeId_idx` (`storeId`),
  CONSTRAINT `support_ticket_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `support_ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_ticket`
--

LOCK TABLES `support_ticket` WRITE;
/*!40000 ALTER TABLE `support_ticket` DISABLE KEYS */;
INSERT INTO `support_ticket` VALUES ('cmoawlizw0001i6mw5p13jcvq','Estou com muita dor de cabeça com esse sistema','OPEN','MEDIUM','demo_user_id','cmoach8dm0001i6tow1kihrmu','2026-04-23 03:10:00.042','2026-04-24 04:05:32.188');
/*!40000 ALTER TABLE `support_ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_announcement`
--

DROP TABLE IF EXISTS `system_announcement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_announcement` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'INFO',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_announcement`
--

LOCK TABLES `system_announcement` WRITE;
/*!40000 ALTER TABLE `system_announcement` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_announcement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `table`
--

DROP TABLE IF EXISTS `table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `table` (
  `id` varchar(191) NOT NULL,
  `number` varchar(191) NOT NULL,
  `capacity` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Table_number_storeId_key` (`number`,`storeId`),
  KEY `Table_storeId_fkey` (`storeId`),
  CONSTRAINT `Table_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `table`
--

LOCK TABLES `table` WRITE;
/*!40000 ALTER TABLE `table` DISABLE KEYS */;
INSERT INTO `table` VALUES ('table_gmd3lfl_1776885088071','01',4,1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 19:11:28.077','2026-04-22 19:11:28.071');
/*!40000 ALTER TABLE `table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `emailVerified` datetime(3) DEFAULT NULL,
  `image` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `role` enum('USER','ADMIN','SUPERADMIN') NOT NULL DEFAULT 'USER',
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('demo_user_id','José Silva - Shallom','demo@shallom.com','$2b$12$/96BJpoJcKKsZiCzhqi0zexVP6OuFV0VaPe0KXTrvXooZcVzP7dr2',NULL,NULL,'2026-04-22 17:46:47.336','2026-04-22 17:46:47.335','SUPERADMIN'),('superadmin_id','Administrador Geral','admin@saas.com','$2b$12$/96BJpoJcKKsZiCzhqi0zexVP6OuFV0VaPe0KXTrvXooZcVzP7dr2',NULL,NULL,'2026-04-22 17:46:47.333','2026-04-22 17:46:47.331','SUPERADMIN');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waiter`
--

DROP TABLE IF EXISTS `waiter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `waiter` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Waiter_storeId_fkey` (`storeId`),
  CONSTRAINT `Waiter_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waiter`
--

LOCK TABLES `waiter` WRITE;
/*!40000 ALTER TABLE `waiter` DISABLE KEYS */;
INSERT INTO `waiter` VALUES ('waiter_236r4js_1776885093963','CARLOS','',1,'cmoach8dm0001i6tow1kihrmu','2026-04-22 19:11:33.969','2026-04-22 19:11:33.963');
/*!40000 ALTER TABLE `waiter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook_log`
--

DROP TABLE IF EXISTS `webhook_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `webhook_log` (
  `id` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `event` varchar(191) NOT NULL,
  `payload` longtext NOT NULL,
  `status` int(11) NOT NULL DEFAULT 200,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook_log`
--

LOCK TABLES `webhook_log` WRITE;
/*!40000 ALTER TABLE `webhook_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_log` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-24  1:17:10

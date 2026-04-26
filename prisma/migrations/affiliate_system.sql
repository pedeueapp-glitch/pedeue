-- =============================================
-- MIGRATION: Sistema de Afiliados da Plataforma
-- Aplicar no banco de PRODUÇÃO via SSH/cliente MySQL
-- =============================================

-- 1. Adicionar coluna platformAffiliateId na tabela store
ALTER TABLE `store` ADD COLUMN `platformAffiliateId` VARCHAR(191) NULL;
CREATE INDEX `store_platformAffiliateId_idx` ON `store`(`platformAffiliateId`);

-- 2. Adicionar AFFILIATE ao enum user_role
ALTER TABLE `user` MODIFY COLUMN `role` ENUM('USER', 'ADMIN', 'SUPERADMIN', 'AFFILIATE') NOT NULL DEFAULT 'USER';

-- 3. Criar tabela platform_affiliate
CREATE TABLE `platform_affiliate` (
  `id`             VARCHAR(191) NOT NULL,
  `userId`         VARCHAR(191) NOT NULL,
  `name`           VARCHAR(191) NOT NULL,
  `email`          VARCHAR(191) NOT NULL,
  `pixKey`         VARCHAR(191) NULL,
  `commissionRate` DOUBLE NOT NULL DEFAULT 0.10,
  `isActive`       BOOLEAN NOT NULL DEFAULT true,
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `platform_affiliate_userId_key`(`userId`),
  UNIQUE INDEX `platform_affiliate_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Criar tabela affiliate_commission
CREATE TABLE `affiliate_commission` (
  `id`                    VARCHAR(191) NOT NULL,
  `platformAffiliateId`   VARCHAR(191) NOT NULL,
  `storeId`               VARCHAR(191) NOT NULL,
  `platformTransactionId` VARCHAR(191) NOT NULL,
  `amount`                DOUBLE NOT NULL,
  `status`                VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `paidAt`                DATETIME(3) NULL,
  `createdAt`             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `affiliate_commission_platformAffiliateId_idx`(`platformAffiliateId`),
  INDEX `affiliate_commission_storeId_idx`(`storeId`),
  INDEX `affiliate_commission_platformTransactionId_idx`(`platformTransactionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Adicionar foreign keys
ALTER TABLE `store` ADD CONSTRAINT `store_platformAffiliateId_fkey`
  FOREIGN KEY (`platformAffiliateId`) REFERENCES `platform_affiliate`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `platform_affiliate` ADD CONSTRAINT `platform_affiliate_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `affiliate_commission` ADD CONSTRAINT `affiliate_commission_platformAffiliateId_fkey`
  FOREIGN KEY (`platformAffiliateId`) REFERENCES `platform_affiliate`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Executar este SQL no banco de dados de produção para adicionar
-- os campos de retiradas e notas ao caixa (cashiersession)

ALTER TABLE `cashiersession`
  ADD COLUMN IF NOT EXISTS `withdrawals` LONGTEXT NULL,
  ADD COLUMN IF NOT EXISTS `closingNotes` VARCHAR(500) NULL;

-- Também garantir a coluna pixKey na tabela store, caso não exista
ALTER TABLE `store`
  ADD COLUMN IF NOT EXISTS `pixKey` VARCHAR(255) NULL;

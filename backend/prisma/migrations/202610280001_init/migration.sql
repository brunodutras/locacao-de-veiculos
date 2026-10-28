CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(60) NOT NULL,
    `dataCadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Veiculo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `marca` VARCHAR(60) NOT NULL,
    `modelo` VARCHAR(80) NOT NULL,
    `placa` VARCHAR(7) NOT NULL,
    `ano` INTEGER NOT NULL,
    `valorDiaria` DECIMAL(10, 2) NOT NULL,
    `disponivel` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Veiculo_placa_key`(`placa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Locacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `veiculoId` INTEGER NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataPrevistaDevolucao` DATETIME(3) NOT NULL,
    `dataDevolucao` DATETIME(3) NULL,
    `valorTotal` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('ATIVA', 'FINALIZADA') NOT NULL DEFAULT 'ATIVA',

    INDEX `Locacao_usuarioId_dataInicio_idx`(`usuarioId`, `dataInicio`),
    INDEX `Locacao_veiculoId_status_idx`(`veiculoId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Locacao` ADD CONSTRAINT `Locacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Locacao` ADD CONSTRAINT `Locacao_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `Veiculo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Veiculo` ADD CONSTRAINT `Veiculo_valorDiaria_positivo` CHECK (`valorDiaria` > 0);
ALTER TABLE `Locacao` ADD CONSTRAINT `Locacao_periodo_valido` CHECK (`dataPrevistaDevolucao` > `dataInicio`);
ALTER TABLE `Locacao` ADD CONSTRAINT `Locacao_valorTotal_positivo` CHECK (`valorTotal` > 0);
ALTER TABLE `Locacao` ADD CONSTRAINT `Locacao_devolucao_status` CHECK ((`status` = 'ATIVA' AND `dataDevolucao` IS NULL) OR (`status` = 'FINALIZADA' AND `dataDevolucao` IS NOT NULL));

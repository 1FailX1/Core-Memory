<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260226145045 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__memory_entry AS SELECT id, title, description, image, date_start, date_end, created_at, updated_at, memory_type_id FROM memory_entry');
        $this->addSql('DROP TABLE memory_entry');
        $this->addSql('CREATE TABLE memory_entry (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, image CLOB DEFAULT NULL, date_start DATE DEFAULT NULL, date_end DATE DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, memory_type_id INTEGER DEFAULT NULL, color VARCHAR(255) DEFAULT NULL, CONSTRAINT FK_CC36831CF60B724C FOREIGN KEY (memory_type_id) REFERENCES memory_type (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO memory_entry (id, title, description, image, date_start, date_end, created_at, updated_at, memory_type_id) SELECT id, title, description, image, date_start, date_end, created_at, updated_at, memory_type_id FROM __temp__memory_entry');
        $this->addSql('DROP TABLE __temp__memory_entry');
        $this->addSql('CREATE INDEX IDX_CC36831CF60B724C ON memory_entry (memory_type_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__memory_entry AS SELECT id, title, description, image, date_start, date_end, created_at, updated_at, memory_type_id FROM memory_entry');
        $this->addSql('DROP TABLE memory_entry');
        $this->addSql('CREATE TABLE memory_entry (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, image CLOB DEFAULT NULL, date_start DATETIME DEFAULT NULL, date_end DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, memory_type_id INTEGER DEFAULT NULL, CONSTRAINT FK_CC36831CF60B724C FOREIGN KEY (memory_type_id) REFERENCES memory_type (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO memory_entry (id, title, description, image, date_start, date_end, created_at, updated_at, memory_type_id) SELECT id, title, description, image, date_start, date_end, created_at, updated_at, memory_type_id FROM __temp__memory_entry');
        $this->addSql('DROP TABLE __temp__memory_entry');
        $this->addSql('CREATE INDEX IDX_CC36831CF60B724C ON memory_entry (memory_type_id)');
    }
}

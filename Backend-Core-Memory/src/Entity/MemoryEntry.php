<?php

namespace App\Entity;

use App\Repository\MemoryEntryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MemoryEntryRepository::class)]
class MemoryEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['memory:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['memory:read'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['memory:read'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['memory:read'])]
    private ?string $image = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['memory:read'])]
    private ?\DateTime $date_start = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['memory:read'])]
    private ?\DateTime $date_end = null;

    #[ORM\Column]
    #[Groups(['memory:read'])]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column]
    #[Groups(['memory:read'])]
    private ?\DateTimeImmutable $updated_at = null;

    #[ORM\ManyToOne(inversedBy: 'memoryEntries')]
    #[Groups(['memory:read'])]
    private ?MemoryType $MemoryType = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['memory:read'])]
    private ?string $color = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): static
    {
        $this->image = $image;

        return $this;
    }

    public function getDateStart(): ?\DateTime
    {
        return $this->date_start;
    }

    public function setDateStart(?\DateTime $date_start): static
    {
        $this->date_start = $date_start;

        return $this;
    }

    public function getDateEnd(): ?\DateTime
    {
        return $this->date_end;
    }

    public function setDateEnd(?\DateTime $date_end): static
    {
        $this->date_end = $date_end;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(\DateTimeImmutable $updated_at): static
    {
        $this->updated_at = $updated_at;

        return $this;
    }

    public function getMemoryType(): ?MemoryType
    {
        return $this->MemoryType;
    }

    public function setMemoryType(?MemoryType $MemoryType): static
    {
        $this->MemoryType = $MemoryType;

        return $this;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(?string $color): static
    {
        $this->color = $color;

        return $this;
    }
}
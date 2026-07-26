<?php

namespace App\Entity;

use App\Repository\MemoryTypeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: MemoryTypeRepository::class)]
class MemoryType
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['type:read', 'memory:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['type:read', 'memory:read'])]
    private ?string $type = null;

    /**
     * @var Collection<int, MemoryEntry>
     */
    #[ORM\OneToMany(targetEntity: MemoryEntry::class, mappedBy: 'MemoryType')]
    private Collection $memoryEntries;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $color = null;

    public function __construct()
    {
        $this->memoryEntries = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return Collection<int, MemoryEntry>
     */
    public function getMemoryEntries(): Collection
    {
        return $this->memoryEntries;
    }

    public function addMemoryEntry(MemoryEntry $memoryEntry): static
    {
        if (!$this->memoryEntries->contains($memoryEntry)) {
            $this->memoryEntries->add($memoryEntry);
            $memoryEntry->setMemoryType($this);
        }

        return $this;
    }

    public function removeMemoryEntry(MemoryEntry $memoryEntry): static
    {
        if ($this->memoryEntries->removeElement($memoryEntry)) {
            // set the owning side to null (unless already changed)
            if ($memoryEntry->getMemoryType() === $this) {
                $memoryEntry->setMemoryType(null);
            }
        }

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
<?php

// src/Controller/MemoryEntryController.php
namespace App\Controller;

use App\Entity\MemoryEntry;
use App\Entity\MemoryType;
use App\Repository\MemoryEntryRepository;
use App\Repository\MemoryTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/memory')]
final class MemoryEntryController extends AbstractController
{
    #[Route('', name: 'app_memory_index', methods: ['GET'])]
    public function index(MemoryEntryRepository $repo): Response
    {
        $entries = $repo->findAll();
        return $this->json($entries, 200, [], ['groups' => 'memory:read']);
    }

    #[Route('/new', name: 'app_memory_new', methods: ['POST'])]
    public function new(Request $request, EntityManagerInterface $em, MemoryTypeRepository $memoryTypeRepository): Response
    {
        $data = json_decode($request->getContent(), true);

        $entry = new MemoryEntry();
        $entry->setTitle($data['title'] ?? null);
        $entry->setDescription($data['description'] ?? null);
        $entry->setMemoryType($memoryTypeRepository->find($data['memoryTypeId']));
        if (!empty($data['dateStart'])) {
            $entry->setDateStart(new \DateTime($data['dateStart']));
        }
        if (!empty($data['dateEnd'])) {
            $entry->setDateEnd(new \DateTime($data['dateEnd']));
        }
        $entry->setImage($data['imageUrl'] ?? null);
        $entry->setColor($data['color'] ?? "#000000");
        $entry->setCreatedAt(new \DateTimeImmutable());
        $entry->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($entry);
        $em->flush();

        return $this->json($entry, 201, [], ['groups' => 'memory:read']);
    }

    #[Route('/{id}', name: 'app_memory_show', methods: ['GET'])]
    public function show(MemoryEntry $entry): Response
    {
        return $this->json($entry, 200, [], ['groups' => 'memory:read']);
    }

    #[Route('/{id}/edit', name: 'app_memory_edit', methods: ['PUT', 'PATCH'])]
    public function edit(Request $request, MemoryEntry $entry, EntityManagerInterface $em): Response
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['title'])) {
            $entry->setTitle($data['title']);
        }
        if (isset($data['description'])) {
            $entry->setDescription($data['description']);
        }
        if (isset($data['type'])) {
            $entry->setType($data['type']);
        }
        if (isset($data['dateStart'])) {
            $entry->setDateStart(new \DateTime($data['dateStart']));
        }
        if (isset($data['dateEnd'])) {
            $entry->setDateEnd(new \DateTime($data['dateEnd']));
        }
        if (isset($data['imageUrl'])) {
            $entry->setImageUrl($data['imageUrl']);
        }
        if (isset($data['color'])) {
            $entry->setColor($data['color']);
        }
        $entry->setUpdatedAt(new \DateTimeImmutable());

        $em->flush();

        return $this->json($entry, 200, [], ['groups' => 'memory:read']);
    }

    #[Route('/{id}', name: 'app_memory_delete', methods: ['DELETE'])]
    public function delete(MemoryEntry $entry, EntityManagerInterface $em): Response
    {
        $em->remove($entry);
        $em->flush();

        return $this->json(null, 204);
    }
}
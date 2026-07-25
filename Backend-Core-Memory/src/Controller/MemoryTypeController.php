<?php

namespace App\Controller;

use App\Entity\MemoryType;
use App\Form\MemoryTypeType;
use App\Repository\MemoryTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Serializer\SerializerInterface;


#[Route('/type')]
final class MemoryTypeController extends AbstractController
{
    #[Route(name: 'app_memory_type_index', methods: ['GET'])]
    public function index(MemoryTypeRepository $memoryTypeRepository): Response
    {
        return $this->render('memory_type/index.html.twig', [
            'memory_types' => $memoryTypeRepository->findAll(),
        ]);
    }

    #[Route('/api', name: 'app_memory_type_json', methods: ['GET'])]
    public function apiGet(
        MemoryTypeRepository $memoryTypeRepository,
        SerializerInterface $serializer
    ): Response {
        $entries = $memoryTypeRepository->findAll();

        $json = $serializer->serialize(
            $entries,
            'json',
            ['groups' => 'type:read']
        );

        return new Response($json, 200, [
            'Content-Type' => 'application/json'
        ]);
    }


    #[Route('/new', name: 'app_memory_type_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $memoryType = new MemoryType();
        $form = $this->createForm(MemoryTypeType::class, $memoryType);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($memoryType);
            $entityManager->flush();

            return $this->redirectToRoute('app_memory_type_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('memory_type/new.html.twig', [
            'memory_type' => $memoryType,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_memory_type_show', methods: ['GET'])]
    public function show(MemoryType $memoryType): Response
    {
        return $this->render('memory_type/show.html.twig', [
            'memory_type' => $memoryType,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_memory_type_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, MemoryType $memoryType, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(MemoryTypeType::class, $memoryType);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_memory_type_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('memory_type/edit.html.twig', [
            'memory_type' => $memoryType,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_memory_type_delete', methods: ['POST'])]
    public function delete(Request $request, MemoryType $memoryType, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete' . $memoryType->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($memoryType);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_memory_type_index', [], Response::HTTP_SEE_OTHER);
    }
}
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from 'zod';
import { createReadStream } from "fs";
import { openai } from "../lib/openai";
import { streamToResponse, OpenAIStream } from 'ai'

export async function generateIACompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (req, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5),
    })

    const { videoId, prompt, temperature } = bodySchema.parse(req.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      }
    })

    if (!video.transcription) {
      return reply.status(400).send({error: 'Video was not generated yet.'})
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature,
      messages: [
        { role: 'user', content: promptMessage},
      ],
      stream: true,
    })

    const stream = OpenAIStream(response)

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-ALlow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    })
  })
}
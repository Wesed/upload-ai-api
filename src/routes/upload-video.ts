import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const pump = promisify(pipeline)

export async function uploadVideosRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25 //25MB
    }
  })

  app.post('/videos', async (req, reply) => {
    const data = await req.file()

    if (!data) {
      return reply.status(400).send({error: 'Missing file input.'})
    }

    // pega a extensão do arquivo (.mp3)
    const extension = path.extname(data.filename)

    if (extension !== '.mp3') {
      return reply.status(400).send({error: 'Invalid input type, please upload a MP3.'})
    }

    // retorna o nome do arquivo sem a extensão
    const fileBaseName = path.basename(data.filename, extension)

    // gerando um nome único pra cada arquivo: nome + id aleatório + extensão
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

    // destino onde o arquivo vai ser salvo
    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)
    
    // recebendo aos poucos / enviando aos poucos
    await pump(data.file, fs.createWriteStream(uploadDestination))

    // cadastra no banco
    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDestination,
      }
    })

    return {
      video, 
    }
  })
}
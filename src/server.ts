import { fastify } from 'fastify'
import { getALlPromptsRoute } from './routes/get-all-prompts'
import { uploadVideosRoute } from './routes/upload-video'
import { createTranscriptionRoute } from './routes/create-transcription'
import { generateIACompletionRoute } from './routes/generate-ia-completion'
import { fastifyCors } from '@fastify/cors'

const app = fastify()

app.register(fastifyCors, {
  origin: '*',
})

app.register(getALlPromptsRoute)
app.register(uploadVideosRoute)
app.register(createTranscriptionRoute)
app.register(generateIACompletionRoute)

app.listen({
  port: 3333,
}).then(()=>{
  console.log('Server is running! 🔥')
})

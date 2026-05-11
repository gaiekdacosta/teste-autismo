import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../lib/supabase'

const ALTERNATIVAS_PADRAO = [
  { posicao: 1, texto: 'Concordo totalmente', valor: 1 },
  { posicao: 2, texto: 'Concordo um pouco', valor: 1 },
  { posicao: 3, texto: 'Discordo um pouco', valor: 0 },
  { posicao: 4, texto: 'Discordo totalmente', valor: 0 },
]

async function addAlternativas() {
  try {
    // Buscar o questionário ativo
    const { data: questionario, error: questionarioError } = await supabaseAdmin
      .from('questionario')
      .select('id, titulo')
      .eq('ativo', true)
      .single()

    if (questionarioError) {
      console.error('Erro ao buscar questionário ativo:', questionarioError)
      process.exit(1)
    }

    console.log(`Questionário encontrado: ${questionario.titulo} (ID: ${questionario.id})`)

    // Buscar todas as questões do questionário
    const { data: questoes, error: questoesError } = await supabaseAdmin
      .from('questoes')
      .select('id, pergunta')
      .eq('id_questionario', questionario.id)
      .order('posicao', { ascending: true })

    if (questoesError) {
      console.error('Erro ao buscar questões:', questoesError)
      process.exit(1)
    }

    console.log(`Encontradas ${questoes.length} questões`)

    // Para cada questão, adicionar as alternativas
    for (const questao of questoes) {
      console.log(`Processando questão: ${questao.pergunta}`)

      // Verificar se já tem alternativas
      const { data: alternativasExistentes } = await supabaseAdmin
        .from('alternativas')
        .select('id')
        .eq('id_questao', questao.id)

      if (alternativasExistentes && alternativasExistentes.length > 0) {
        console.log(`  → Já possui ${alternativasExistentes.length} alternativas, pulando...`)
        continue
      }

      // Criar as alternativas
      const alternativas = ALTERNATIVAS_PADRAO.map((alt) => ({
        id: randomUUID(),
        id_questao: questao.id,
        posicao: alt.posicao,
        texto: alt.texto,
        valor: alt.valor,
      }))

      const { error: insertError } = await supabaseAdmin
        .from('alternativas')
        .insert(alternativas)

      if (insertError) {
        console.error(`  → Erro ao inserir alternativas:`, insertError)
        continue
      }

      console.log(`  → ${alternativas.length} alternativas adicionadas com sucesso`)
    }

    console.log('\n✅ Processo concluído com sucesso!')
  } catch (error) {
    console.error('Erro inesperado:', error)
    process.exit(1)
  }
}

addAlternativas()

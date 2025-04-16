# codiguinhos
# Garagem Inteligente PRO 🚗💨

## Visão Geral

A Garagem Inteligente PRO é uma aplicação web interativa desenvolvida para simular o gerenciamento de uma garagem de veículos. Utilizando conceitos de Programação Orientada a Objetos (POO) em JavaScript puro, a aplicação permite aos usuários adicionar, visualizar, interagir e manter diferentes tipos de veículos (Carros Comuns, Carros Esportivos com turbo e Caminhões com capacidade de carga). Toda a informação da garagem é persistida localmente no navegador através da API LocalStorage, garantindo que os dados não sejam perdidos ao recarregar a página. A interface é construída com HTML semântico e estilizada com CSS moderno, incluindo um layout responsivo.

## Funcionalidades Principais ✨

*   **Adição de Veículos:** Permite adicionar diferentes tipos de veículos à garagem:
    *   Carro Comum
    *   Carro Esportivo (com funcionalidade de Turbo)
    *   Caminhão (com definição de Capacidade de Carga)
*   **Visualização da Garagem:** Lista todos os veículos presentes na garagem em uma barra lateral (sidebar).
*   **Seleção e Detalhes:** Ao selecionar um veículo na lista, exibe seus detalhes completos em um painel principal, incluindo:
    *   Imagem, Modelo, Cor, ID único.
    *   Status (Ligado/Desligado).
    *   Quilometragem (para Carros e derivados).
    *   Velocidade atual (com barra visual em relação à máxima).
    *   Status do Turbo (para Carros Esportivos).
    *   Carga Atual e Capacidade (para Caminhões).
    *   Histórico de Manutenções passadas.
    *   Agendamentos de Serviços futuros.
*   **Edição Rápida:** Permite alterar rapidamente o Modelo, Cor e URL da Imagem do veículo selecionado.
*   **Interação com Veículos (Ações):**
    *   Ligar / Desligar o motor (com validação de movimento para desligar).
    *   Acelerar (com comportamento diferenciado por tipo de veículo e influência de carga/turbo).
    *   Frear (com comportamento diferenciado por tipo de veículo e influência de carga).
    *   Buzinar (com sons diferentes por tipo de veículo - *se implementado no áudio*).
    *   Simular Rodagem (aumenta a quilometragem).
*   **Ações Específicas:**
    *   Ativar / Desativar Turbo (para Carros Esportivos).
    *   Carregar / Descarregar (para Caminhões, respeitando a capacidade).
*   **Gerenciamento de Manutenção:**
    *   Registrar serviços de manutenção já realizados (Tipo, Custo, Descrição).
    *   Agendar serviços futuros (Tipo, Data/Hora, Observações).
*   **Persistência de Dados:** Todas as informações da garagem (veículos e seus históricos) são salvas automaticamente no LocalStorage do navegador.
*   **Feedback ao Usuário:** Notificações visuais (para sucessos, erros, avisos) e sonoras (para ações principais).
*   **Exclusão de Veículos:** Permite remover permanentemente um veículo da garagem.
*   **Interface Responsiva:** O layout se adapta a diferentes tamanhos de tela (desktop, tablet, mobile).

## Como Executar Localmente 🚀

Este projeto é construído com HTML, CSS e JavaScript puro, utilizando módulos ES6.

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
    ```
    (Substitua `SEU-USUARIO/SEU-REPOSITORIO` pelo caminho real do seu repo no GitHub)

2.  **Navegue até a Pasta:**
    ```bash
    cd SEU-REPOSITORIO
    ```

3.  **Abra o Arquivo HTML:**
    *   A maneira mais simples é abrir o arquivo `index.html` diretamente no seu navegador web (Chrome, Firefox, Edge, etc.).
    *   **Importante (Módulos ES6):** Devido ao uso de `import`/`export` nos arquivos JavaScript (`type="module"`), alguns navegadores podem restringir o carregamento direto do `file:///` por razões de segurança (CORS). Se a aplicação não carregar corretamente (verifique o console F12 por erros relacionados a módulos ou CORS), **é recomendado usar um servidor web local simples:**
        *   Se você usa o **VS Code**, instale a extensão "Live Server" e clique com o botão direito no `index.html` e selecione "Open with Live Server".
        *   Alternativamente, use `npx serve` (se tiver Node.js/npm instalado) na pasta do projeto ou qualquer outro servidor HTTP simples.

## Estrutura do Projeto 📁
Use code with caution.
Markdown
GaragemInteligentePRO/
├── index.html # Arquivo principal da interface do usuário
├── style.css # Folha de estilos principal
├── js/ # Pasta contendo todo o código JavaScript
│ ├── main.js # Ponto de entrada principal: Lógica da UI, eventos, inicialização
│ ├── Manutencao.js # Definição da classe Manutencao
│ ├── Veiculo.js # Definição da classe base Veiculo
│ ├── Carro.js # Definição da classe Carro (herda de Veiculo)
│ ├── CarroEsportivo.js # Definição da classe CarroEsportivo (herda de Carro)
│ └── Caminhao.js # Definição da classe Caminhao (herda de Carro)
├── sounds/ # Pasta para arquivos de áudio (feedback sonoro)
│ ├── ligar.mp3
│ ├── desligar.mp3
│ ├── buzina_carro.mp3
│ └── ... # Outros arquivos .mp3
├── placeholder.png # Imagem padrão para veículos sem URL definida
└── README.md # Este arquivo de documentação
## Tecnologias Utilizadas 🛠️

*   **HTML5:** Estrutura semântica da página.
*   **CSS3:** Estilização e layout da interface.
    *   Variáveis CSS (Custom Properties): Para fácil manutenção do tema.
    *   Flexbox & Grid: Para organização do layout responsivo.
*   **JavaScript (ES6+):** Lógica principal da aplicação.
    *   **Módulos ES6:** Organização do código (`import`/`export`).
    *   **Programação Orientada a Objetos (POO):**
        *   Classes: Para modelar `Veiculo`, `Carro`, `CarroEsportivo`, `Caminhao`, `Manutencao`.
        *   Herança: Reutilização de código (`extends`).
        *   Polimorfismo: Métodos com comportamento específico por classe (ex: `getDisplayInfo`, `acelerar`).
        *   Encapsulamento: Agrupamento de dados e comportamento.
    *   **DOM Manipulation:** Interação com a estrutura HTML para atualizar a UI.
    *   **Event Handling:** Captura de interações do usuário (cliques, submits, etc.).
    *   **LocalStorage API:** Persistência dos dados da garagem no navegador.
    *   **JSON:** Serialização/Desserialização dos dados para o LocalStorage.
*   **JSDoc:** Formato de comentário para documentação do código JavaScript.

---

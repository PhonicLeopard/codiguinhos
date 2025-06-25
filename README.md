Garagem Inteligente PRO 🚗💨
![alt text](https://img.shields.io/badge/status-ativo-brightgreen)

![alt text](https://img.shields.io/badge/javascript-ES6%2B-yellow)

![alt text](https://img.shields.io/badge/backend-Node.js%20%26%20Express-lightblue)

![alt text](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
Visão Geral
A Garagem Inteligente PRO é uma aplicação web full-stack que simula o gerenciamento completo de uma garagem de veículos. O projeto demonstra sólidos conceitos de Programação Orientada a Objetos (POO) no frontend com JavaScript puro, e a utilização de um backend em Node.js com Express para servir dados e atuar como um proxy seguro para APIs externas.
O usuário pode adicionar, visualizar, interagir e manter diferentes tipos de veículos (Carros Comuns, Esportivos e Caminhões). A aplicação consome dados de um backend local para funcionalidades como "Veículos em Destaque", "Dicas de Manutenção" e "Peças Recomendadas", além de buscar de forma segura a previsão do tempo através de um endpoint proxy, garantindo que a chave da API externa nunca seja exposta no cliente.
✨ Funcionalidades Principais
Arquitetura Cliente-Servidor: Frontend desacoplado que consome uma API local Node.js.
Backend Proxy Seguro: A chave da API OpenWeatherMap é mantida segura no servidor, que faz a requisição em nome do cliente, resolvendo uma vulnerabilidade de segurança crítica.
API de Dados Mock: O backend serve endpoints para:
🚗 Veículos em Destaque: Exibe um showroom na tela inicial.
🛠️ Serviços, Peças e Dicas: Fornece dados dinâmicos de manutenção para cada tipo de veículo.
Gerenciamento Completo da Garagem:
Adição de Carros, Carros Esportivos (com turbo) e Caminhões (com carga).
Edição rápida de propriedades (modelo, cor, imagem).
Interações realistas (ligar, acelerar, frear) com comportamentos polimórficos.
Registro e agendamento de manutenções.
Persistência de Dados: A garagem do usuário é salva no LocalStorage, enquanto dados de apoio são carregados do backend.
Interface Reativa e Moderna: Construída com HTML semântico e CSS moderno (Flexbox, Grid, Variáveis CSS), com feedback visual e sonoro para o usuário.
🏛️ Arquitetura da Aplicação
O projeto segue uma arquitetura cliente-servidor simples, ideal para aprendizado e desenvolvimento.
Generated mermaid
graph TD
    A[👨‍💻 Usuário] -->|Interage com| B(🌐 Navegador - Frontend);
    B -->|Requisições HTTP (fetch)| C{🚀 Servidor Node.js - Backend};
    C -->|Carrega dados locais| D[📄 Mock Data (JSON)];
    C -->|Requisição Segura com API Key| E[🌦️ API Externa - OpenWeatherMap];
    E -->|Retorna dados| C;
    D -->|Retorna dados| C;
    C -->|Envia resposta JSON| B;
Use code with caution.
Mermaid
🛠️ Tecnologias Utilizadas
Frontend
HTML5: Estrutura semântica da página.
CSS3: Estilização avançada com Flexbox, Grid e Variáveis CSS para um layout responsivo e de fácil manutenção.
JavaScript (ES6+):
Módulos ES6 (import/export): Organização e modularização do código.
Programação Orientada a Objetos (POO): Classes, Herança (extends), Polimorfismo e Encapsulamento para modelar os veículos.
Async/Await: Para chamadas de API assíncronas e mais legíveis.
Manipulação do DOM: Para criar uma interface dinâmica e interativa.
APIs do Navegador:
LocalStorage API: Para persistir o estado da garagem do usuário.
Fetch API: Para comunicação com o backend.
Audio API: Para feedback sonoro.
Backend
Node.js: Ambiente de execução para o JavaScript no servidor.
Express.js: Framework minimalista para criação de rotas e da API REST.
dotenv: Para gerenciar variáveis de ambiente (como a API Key) de forma segura.
nodemon: Ferramenta de desenvolvimento para reiniciar o servidor automaticamente após alterações no código.
🚀 Como Executar o Projeto
Para rodar este projeto, você precisará ter o Node.js (que inclui o npm) e o Git instalados.
1. Configuração do Backend
Primeiro, vamos clonar o repositório e configurar o servidor.
Generated bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Navegue até a pasta do projeto
cd SEU-REPOSITORIO

# Instale as dependências do backend
npm install
Use code with caution.
Bash
Antes de iniciar o servidor, você precisa criar um arquivo de configuração para a sua chave de API.
Crie um arquivo chamado .env na raiz do projeto.
Dentro deste arquivo, adicione sua chave da API OpenWeatherMap. Você pode obter uma gratuitamente no site deles.
Generated ini
# Arquivo: .env
OPENWEATHER_API_KEY_BACKEND="SUA_CHAVE_API_AQUI"
PORT=3001
Use code with caution.
Ini
Agora, inicie o servidor backend:
Generated bash
# Inicia o servidor em modo de desenvolvimento (reinicia automaticamente)
npm run dev

# Ou, para iniciar normalmente:
node server.js
Use code with caution.
Bash
O terminal deverá exibir a mensagem Servidor backend rodando na porta 3001.
2. Execução do Frontend
Com o backend rodando, o frontend pode ser aberto em seu navegador.
Use a extensão "Live Server" no VS Code:
Clique com o botão direito no arquivo index.html.
Selecione "Open with Live Server".
Isso é recomendado pois garante que o JavaScript (módulos ES6) e as chamadas para http://localhost:3001 funcionem corretamente.
Alternativa (sem Live Server):
Abra o arquivo index.html diretamente no navegador.
Atenção: Alguns navegadores podem bloquear as requisições do frontend (rodando em file:///) para o backend (em localhost). O uso do Live Server evita esse problema de CORS.
Agora a aplicação deve estar totalmente funcional!
📁 Estrutura do Projeto
Generated code
GaragemInteligentePRO/
├── .gitignore               # Arquivos a serem ignorados pelo Git
├── index.html               # Estrutura principal da UI (Frontend)
├── style.css                # Folha de estilos (Frontend)
├── main.js                  # Ponto de entrada do JS, lógica da UI (Frontend)
├── weatherService.js        # Lógica para consumir a API de previsão do tempo (Frontend)
├── Veiculo.js               # Classe base `Veiculo` (Frontend)
├── Carro.js                 # Classe `Carro` (Frontend)
├── CarroEsportivo.js        # Classe `CarroEsportivo` (Frontend)
├── Caminhao.js              # Classe `Caminhao` (Frontend)
├── Manutencao.js            # Classe `Manutencao` (Frontend)
├── server.js                # Arquivo do servidor Express (Backend)
├── package.json             # Dependências e scripts do projeto Node.js
├── package-lock.json        # Lockfile das dependências
├── dados_veiculos_api.json  # Dados simulados para uma API (não usado diretamente)
├── sounds/                  # Pasta com os arquivos de áudio
└── README.md                # Esta documentação
Use code with caution.
🌐 Endpoints da API (Backend)
O servidor local (localhost:3001) fornece os seguintes endpoints:
Método	Rota	Descrição
GET	/api/weather?city={cidade}	Proxy para OpenWeatherMap. Busca a previsão para a cidade informada.
GET	/api/veiculos-destaque	Retorna uma lista de veículos para o showroom da página inicial.
GET	/api/servicos-oferecidos	Retorna a lista de todos os serviços de manutenção disponíveis.
GET	/api/revisao/:vehicleId	Retorna dados de revisão (mock) para um ID de veículo específico.
GET	/api/dicas-manutencao/:tipoVeiculo?	Retorna dicas de manutenção para um tipo de veículo ou dicas gerais.
GET	/api/pecas-recomendadas/:tipoVeiculo	Retorna peças e fluidos recomendados para um tipo de veículo.


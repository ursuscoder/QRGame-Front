document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    Telegram.WebApp.ready();
    setupMainButton();
    fetchSecrets();
    Telegram.WebApp.expand();
    Telegram.WebApp.setHeaderColor('secondary_bg_color');

    if (Telegram.WebApp.initDataUnsafe.start_param) {
        if (Telegram.WebApp.initDataUnsafe.start_param == 'create_secret')
            window.location = window.location.origin + "/create_secret"
        foundedNewSecret(Telegram.WebApp.initDataUnsafe.start_param);
    }
}

function setupMainButton() {
    Telegram.WebApp.MainButton.setParams({ text: 'Сканировать Секрет' });
    Telegram.WebApp.MainButton.onClick(() => {
        Telegram.WebApp.showScanQrPopup('Улыбайся', qrTextReceived);
    });
    Telegram.WebApp.MainButton.show();
}


function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    const cardContentDiv = document.createElement('div');
    cardContentDiv.className = 'card-content';

    const titleElement = document.createElement('div');
    titleElement.className = 'card-title';
    titleElement.textContent = card.title;

    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'card-description';
    descriptionElement.textContent = card.description;

    cardContentDiv.appendChild(titleElement);
    cardContentDiv.appendChild(descriptionElement);

    const buttonContainerDiv = document.createElement('div');
    buttonContainerDiv.className = 'card-button-container';

    const buttonElement = document.createElement('a');
    buttonElement.className = 'card-button';
    buttonElement.textContent = 'Открыть';
    buttonElement.href = card.link;
    buttonElement.target = '_blank';

    buttonContainerDiv.appendChild(buttonElement);

    cardDiv.appendChild(cardContentDiv);
    cardDiv.appendChild(buttonContainerDiv);

    return cardDiv;
}

function qrTextReceived(data) {
    var text = data;
    if (text.startsWith("https://t.me/secretqr_bot/SecretQR?startapp=") || text.startsWith("tg://resolve?domain=secretqr_bot&appname=SecretQR&startapp=")) {
        const id = text.split('=').pop();
        foundedNewSecret(id);
    } else {
        Telegram.WebApp.showPopup({
            title: '❌ Это не секрет ❌',
            message: 'Сканируй секреты от нашего приложения, другие QR-коды не обрабатываются',
            buttons: [{ id: 'link', text: 'Понятно' }]
        });
    }
    return true;
}

async function foundedNewSecret(id) {
    const data = await fetchSecretById(id);
    if (data) {
        addNewSecret(id, data);
        Telegram.WebApp.showPopup({
            title: '✅ Найден секрет🕵️‍♂️ ✅',
            message: 'Теперь тебе доступен этот секрет, он добавлен в список отсканированных секретов',
            buttons: [{ id: 'link', text: 'Хорошо' }]
        });
    } else {
        Telegram.WebApp.showPopup({
            title: '⚠️ Доступ закрыт🤷‍♀️ ⚠️',
            message: 'Автор секрета не добавил вас в список пользователей, которым доступен этот секрет.',
            buttons: [{ id: 'link', text: 'Ясно' }]
        });
    }
}

async function fetchSecretById(id) {
    const url = `/api/secrets/${id}`;
    const initData = Telegram.WebApp.initData;
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + initData);

    try {
        const response = await fetch(url, { headers: headers });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const container = document.getElementById('card-container');
        const cardElement = createCardElement(data.content);
        container.appendChild(cardElement);
        return data.content;
    } catch (error) {
        console.error('Error fetching secret:', error);
        return false;
    }
}

function addNewSecret(secret_id, data) {
    Telegram.WebApp.CloudStorage.setItem(secret_id, JSON.stringify(data), (error) => {
        if (!error) {
            document.getElementById('no-secrets').style.display = 'none'; // Скрываем сообщение
        }
    });
}

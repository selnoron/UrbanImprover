const IMPROVER_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
const TOKEN_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

const IMPROVER_ABI = [
    "function createCampaign(string title, uint256 goal, uint256 duration) external",
    "function contribute(uint256 id) external payable",
    "function campaignCount() public view returns (uint256)",
    "function campaigns(uint256) public view returns (string title, uint256 goal, uint256 deadline, uint256 currentAmount, address creator, bool completed)"
];
const TOKEN_ABI = [
    "function balanceOf(address) public view returns (uint256)"
];

let signer;
let improverContract;
let tokenContract;
let selectedCampaignId = null;

async function connect() {
    if (!window.ethereum) return alert("Install MetaMask");
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        const address = accounts[0];

        improverContract = new ethers.Contract(IMPROVER_ADDRESS, IMPROVER_ABI, signer);
        tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

        document.getElementById('connect-wallet').innerText = "Connected";
        document.getElementById('status-bar').classList.remove('hidden');
        document.getElementById('user-address').innerText = address.slice(0,6) + '...' + address.slice(-4);
        
        updateBalance(address);
        loadCampaigns(); 
    } catch (err) {
        console.error(err);
    }
}

async function updateBalance(address) {
    const balance = await tokenContract.balanceOf(address);
    document.getElementById('user-balance').innerText = `${ethers.utils.formatEther(balance)} URB`;
}

async function loadCampaigns() {
    const listElement = document.getElementById('campaign-list');
    if (!improverContract) return;
    
    listElement.innerHTML = "Updating projects...";
    
    try {
        const countBN = await improverContract.campaignCount();
        const count = countBN.toNumber();
        
        listElement.innerHTML = "";
        for (let i = 1; i <= count; i++) {
            const cam = await improverContract.campaigns(i);
            
            // Если кампания завершена или цель достигнута — пропускаем её
            if (cam.completed || cam.currentAmount.gte(cam.goal)) continue;

            // Конвертируем дедлайн из UNIX-времени в дату
            const deadlineDate = new Date(cam.deadline.toNumber() * 1000).toLocaleDateString();
            
            const div = document.createElement('div');
            div.className = 'campaign-item';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="font-size: 18px;">${cam.title}</strong><br>
                        <small style="opacity:0.7;">Goal: ${ethers.utils.formatEther(cam.goal)} ETH</small><br>
                        <small style="opacity:0.7;">Raised: ${ethers.utils.formatEther(cam.currentAmount)} ETH</small><br>
                        <small style="color: #0A84FF;">Ends: ${deadlineDate}</small>
                    </div>
                    <span style="color:#30D158; font-size: 24px;">→</span>
                </div>
            `;
            div.onclick = () => openDonateModal(i, cam.title);
            listElement.appendChild(div);
        }

        if (listElement.innerHTML === "") {
            listElement.innerHTML = "No active projects.";
        }
    } catch (e) {
        console.error(e);
        listElement.innerHTML = "Format Error. Check Smart Contract.";
    }
}

function openDonateModal(id, title) {
    selectedCampaignId = id;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('donate-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('donate-modal').classList.add('hidden');
}

async function createNewCampaign() {
    try {
        const title = document.getElementById('cam-title').value;
        const goal = ethers.utils.parseEther(document.getElementById('cam-goal').value);
        const duration = document.getElementById('cam-duration').value;
        const tx = await improverContract.createCampaign(title, goal, duration);
        await tx.wait();
        loadCampaigns();
    } catch (e) { alert("Check inputs"); }
}

async function contributeToCampaign() {
    try {
        const amount = document.getElementById('contribution-amount').value;
        const tx = await improverContract.contribute(selectedCampaignId, { 
            value: ethers.utils.parseEther(amount) 
        });
        await tx.wait();
        alert("Success!");
        closeModal();
        updateBalance(await signer.getAddress());
    } catch (e) { alert("Transaction failed"); }
}

document.getElementById('connect-wallet').onclick = connect;
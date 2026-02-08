const IMPROVER_ADDRESS = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";
const TOKEN_ADDRESS = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";

const IMPROVER_ABI = [
    "function createCampaign(string title, uint256 goal, uint256 duration) external",
    "function contribute(uint256 id) external payable",
    "function withdrawFunds(uint256 id) external",
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
        
        await updateBalance(address);
        await loadCampaigns();
    } catch (err) {
        console.error(err);
    }
}

async function updateBalance(address) {
    try {
        const balance = await tokenContract.balanceOf(address);
        document.getElementById('user-balance').innerText = `${ethers.utils.formatEther(balance)} URB`;
    } catch (e) { console.error(e); }
}

async function loadCampaigns() {
    const listElement = document.getElementById('campaign-list');
    if (!improverContract) return;
    
    listElement.innerHTML = "Updating...";
    
    try {
        const countBN = await improverContract.campaignCount();
        const count = countBN.toNumber();
        
        listElement.innerHTML = "";
        for (let i = 1; i <= count; i++) {
            const cam = await improverContract.campaigns(i);
            const isGoalReached = cam.currentAmount.gte(cam.goal);

            const div = document.createElement('div');
            div.className = `campaign-item ${isGoalReached || cam.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${cam.title}</strong> 
                        ${isGoalReached ? '<span class="status-tag" style="background:#30D158; color:black; margin-left:5px; border-radius:4px; padding:2px 5px; font-size:10px;">DONE</span>' : ''}
                        <br>
                        <small>Raised: ${ethers.utils.formatEther(cam.currentAmount)} / ${ethers.utils.formatEther(cam.goal)} ETH</small>
                    </div>
                    <span>${isGoalReached ? '✓' : '→'}</span>
                </div>
            `;
            div.onclick = () => openDonateModal(i, cam);
            listElement.appendChild(div);
        }
    } catch (e) {
        listElement.innerHTML = "Error";
    }
}

async function openDonateModal(id, cam) {
    selectedCampaignId = id;
    const userAddress = await signer.getAddress();
    const isCreator = cam.creator.toLowerCase() === userAddress.toLowerCase();
    const isGoalReached = cam.currentAmount.gte(cam.goal);

    document.getElementById('modal-title').innerText = cam.title;
    document.getElementById('modal-info').innerText = `Raised: ${ethers.utils.formatEther(cam.currentAmount)} ETH`;

    const donateInputs = document.getElementById('donate-inputs');
    const claimBtn = document.getElementById('claim-btn');

    if (isGoalReached) {
        donateInputs.classList.add('hidden');
        if (isCreator && !cam.completed) {
            claimBtn.classList.remove('hidden');
        } else {
            claimBtn.classList.add('hidden');
        }
    } else {
        donateInputs.classList.remove('hidden');
        claimBtn.classList.add('hidden');
    }
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
    } catch (e) { alert("Error"); }
}

async function contributeToCampaign() {
    try {
        const amount = document.getElementById('contribution-amount').value;
        const tx = await improverContract.contribute(selectedCampaignId, { 
            value: ethers.utils.parseEther(amount) 
        });
        await tx.wait();
        closeModal();
        loadCampaigns();
        updateBalance(await signer.getAddress());
    } catch (e) { alert("Failed"); }
}

async function withdrawFunds() {
    try {
        const currentAddress = await signer.getAddress();
        const balanceBefore = await signer.getBalance();
        console.log("Balance BEFORE:", ethers.utils.formatEther(balanceBefore));

        const tx = await improverContract.withdrawFunds(selectedCampaignId);
        await tx.wait();

        const balanceAfter = await signer.getBalance();
        console.log("Balance AFTER:", ethers.utils.formatEther(balanceAfter));
        
        const diff = balanceAfter.sub(balanceBefore);
        alert("Actual change: " + ethers.utils.formatEther(diff) + " GO");
        
        loadCampaigns();
    } catch (e) {
        console.error("Error details:", e);
    }
}

document.getElementById('connect-wallet').onclick = connect;

if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
}
/* eslint-disable no-console */
import getWeb3 from '@/utils/getWeb3';
import Factory from '@/contracts/EviFactory.json';
import Evi from '@/contracts/Evi.json';
const state = {
  web3: null,
  account: null,
  balance: 0,
  factory: null,
  evies: [],
  insurances: [],
  customers: [],
  manager: null,
  eviesByAdmin: []
};

const mutations = {
  setWeb3(state, payload) {
    state.web3 = payload.web3;
    state.balance = payload.balance;
    state.account = payload.account;
  },
  setFactory(state, payload) {
    state.factory = payload.factoryFunc;
  },
  setMyEvies(state, payload) {
    state.evies = payload.evies;
  },
  setInsurances(state, payload) {
    state.insurances = payload.insurances;
  },
  setCustomers(state, payload) {
    state.customers = payload.customers;
  },
  setManager(state, payload) {
    state.manager = payload.manager;
  },
  setAdminEvies(state, payload) {
    state.setAdminEvies = payload.setAdminEvies;
  }
};

const actions = {
  async setWeb3({ commit }) {
    const web3 = await getWeb3();
    const accounts = await web3.eth.getAccounts();
    window.web3.version.getNetwork((e, netId) => {
      if (netId !== '3') {
        alert('Unknown network, please change network to Ropsten testnet network');
        return;
      }
    });
    if (accounts.length > 0) {
      const account = accounts[0];
      let balance = await web3.eth.getBalance(account);
      balance = parseFloat(web3.utils.fromWei(balance)).toFixed(2);
      commit('setWeb3', { web3: getWeb3, balance, account });
    } else {
      console.log('Account not found');
    }
  },

  async initContarct({ commit, state }) {
    const web3 = await state.web3();
    const networkId = process.env.VUE_APP_NETWORK_ID;
    const factory = new web3.eth.Contract(Factory.abi, Factory.networks[networkId].address, {
      transactionConfirmationBlocks: 1
    });
    let manager = await factory.methods.manager().call();
    let factoryFunc = () => factory;
    commit('setFactory', { factoryFunc });
    commit('setManager', { manager });
  },

  async getAllEvi({ commit, state }) {
    const factory = await state.factory();
    const account = await state.account;
    const web3 = await state.web3();
    let eviAddresses = await factory.methods.getAllContract(account).call({ from: account });
    let evies = [];
    for (let i = 0; i < eviAddresses.length; i++) {
      let evi = {
        instance: null,
        address: null
      };

      evi.instance = new web3.eth.Contract(Evi.abi, eviAddresses[i], {
        transactionConfirmationBlocks: 1
      });

      evi.address = eviAddresses[i];
      evies.push(evi);
    }
    commit('setMyEvies', { evies });
  },

  async createEvi({ state }, param) {
    const factory = await state.factory();
    const account = await state.account;

    await factory.methods
      .createEvi(
        param.location,
        param.date,
        param.times,
        param.priceWei,
        param.packageName,
        param.link
      )
      .send({ from: account, value: param.priceWei })
      .then(() => {
        console.log('create success');
      })
      .catch((e) => {
        throw e;
      });
  },

  async getAllInsurancePackage({ commit, state }) {
    const factory = await state.factory();
    const account = await state.account;
    let insurances = await factory.methods.getAllInsurancePackage().call({ from: account });
    commit('setInsurances', { insurances });
    console.log(insurances);
  },
  async getAllCustomers({ commit, state }) {
    const factory = await state.factory();
    const account = await state.account;
    let customers = await factory.methods.getAllCustomer().call({ from: account });
    commit('setCustomers', { customers });
    console.log(customers);
  },
  async addInsurancePackage({ state }, param) {
    const factory = await state.factory();
    const account = await state.account;

    await factory.methods
      .addInsurancePackage(param.name, param.priceUSD, param.rate)
      .send({ from: account })
      .then(() => {
        console.log('create insurance package success');
      })
      .catch((e) => {
        console.log('Create insurance package error', e);
      });
  },
  async getAllEviesByAdmin({ commit, state }) {
    const factory = await state.factory();
    const account = await state.account;
    const web3 = await state.web3();
    let eviAddresses = await factory.methods.getAllCustomer().call({ from: account });
    let eviesByAdmin = [];
    for (let i = 0; i < eviAddresses.length; i++) {
      let evi = {
        instance: null,
        address: null
      };

      evi.instance = new web3.eth.Contract(Evi.abi, eviAddresses[i], {
        transactionConfirmationBlocks: 1
      });
      console.log(evi.instance);
      // let paid = await evi.instance.methods.price().call({ from: account });

      // console.log('paid', paid);
      // if (paid == false) {
      //   evi.address = eviAddresses[i];
      //   eviesByAdmin.push(evi);
      // }
    }
    commit('setAdminEvies', { eviesByAdmin });
  }
};

const getters = {};

export const contract = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};

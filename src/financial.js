import React from 'react';
import BarChart from './barChart';
import resolveData from './resolveFinancials';
import TransactionInput from './transactionInput';
import AccountInput from './accountInput';
import fileDownload from 'js-file-download';
import FileReaderInput from 'react-file-reader-input';

class Financial extends React.Component {
  constructor() {
    super();
    let data = [];
    let dOne = {
      id: `oasidjas1`,
      raccount: `account`,
      vaccount: `vaccount`,
      category: `test default`,
      type: `income`,
      start: `2018-03-22`,
      rtype: `day`,
      cycle: 3,
      value: 150
    };
    data.push(dOne);
    let dTwo = {
      id: `oasis2`,
      raccount: `account`,
      vaccount: `vaccount`,
      category: `test default`,
      type: `income`,
      start: `2018-03-22`,
      rtype: `day`,
      cycle: 1,
      value: 100
    };
    data.push(dTwo);
    let dThree = {
      id: `oasis3`,
      raccount: `account`,
      vaccount: `vaccount`,
      category: `test complex`,
      type: `income`,
      start: `2018-03-22`,
      rtype: `day of week`,
      cycle: 2,
      value: 35
    };
    data.push(dThree);
    let dFour = {
      id: `oasis6`,
      raccount: `account`,
      vaccount: `vaccount`,
      category: `test complex`,
      type: `income`,
      start: `2018-03-22`,
      rtype: `day of month`,
      cycle: 1,
      value: 90
    };
    data.push(dFour);
    let dThreePointFive = {
      id: `oasis92`,
      raccount: `account`,
      vaccount: `vaccount`,
      category: `test complex`,
      type: `income`,
      start: `2018-09-22`,
      rtype: `none`,
      value: 190
    };
    data.push(dThreePointFive);
    let dFive = {
      id: `oasis8`,
      raccount: `account`,
      vaccount: `vaccount`,
      category: `test comp`,
      type: `expense`,
      start: `2018-03-22`,
      rtype: `day`,
      repeat: 1,
      cycle: 1,
      value: 112
    };
    data.push(dFive);

    let dataArray = {
      transactions: data,
      accounts: [
        {
          name: 'account',
          starting: 3000,
          interest: 0.01,
          vehicle: 'operating'
        }
      ]
    };

    this.state = resolveData(dataArray);

    // this.deleteTransaction = this.deleteTransaction.bind(this);
  }

  handleUpload = (event, results) => {
    let result = JSON.parse(results[0][0].target.result);
    console.log(result);
    this.setState(resolveData(result));
  };

  handleDownload = () => {
    let outputData = {
      transactions: [...this.state.transactions],
      accounts: [...this.state.accounts]
    };
    let fileData = JSON.stringify(outputData);
    fileDownload(fileData, 'financials.json');
  };

  addTransaction = result => {
    let newState = { ...this.state };
    newState.transactions.push(result);
    this.setState(resolveData(newState));
  };

  deleteTransaction = id => {
    let newState = { ...this.state };
    newState.transactions.splice(
      this.state.transactions.findIndex(element => element.id === id),
      1
    );
    this.setState(resolveData(newState));
  };

  addAccount = result => {
    let newState = { ...this.state };
    newState.accounts.push(result);
    this.setState(resolveData(newState));
  };

  deleteAccount = name => {
    let newState = { ...this.state };
    newState.accounts.splice(
      this.state.accounts.findIndex(element => element.name === name),
      1
    );
    this.setState(resolveData(newState));
  };

  render() {
    return (
      <React.Fragment>
        <section className="section">
          <div className="level">
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Daily Income</p>
                <p className="heading">{this.state.dailyIncome}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Daily Expenses</p>
                <p className="heading">{this.state.dailyExpense}</p>
              </div>
            </div>
          </div>
          <BarChart data={this.state} />
        </section>
        <nav className="level">
          <div className="level-left">
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Get your current</p>
                <p className="heading">data out:</p>
                <button
                  className="button is-success"
                  onClick={this.handleDownload}
                >
                  Download
                </button>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Import data from</p>
                <p className="heading">your computer:</p>
                <FileReaderInput
                  as="text"
                  id="my-file-input"
                  onChange={this.handleUpload}
                >
                  <button className="button is-link">Select a file!</button>
                </FileReaderInput>
              </div>
            </div>
          </div>
        </nav>
        <section className="section">
          <div className="columns">
            <div className="column is-half">
              <div className="container is-fluid">
                {transactionTable(this.state.transactions, {
                  deleteTransaction: this.deleteTransaction
                })}
                <TransactionInput addTransaction={this.addTransaction} />
              </div>
            </div>
            <div className="column">
              <div className="container is-fluid">
                {accountTable(this.state.accounts, {
                  deleteAccount: this.deleteAccount
                })}
                <AccountInput addAccount={this.addAccount} />
              </div>
            </div>
          </div>
        </section>
      </React.Fragment>
    );
  }
}

export default Financial;

const transactionTable = (data, actions) => (
  <table className="table is-striped is-hoverable">
    <thead>
      <tr>
        <th>
          <abbr title="unique id">id</abbr>
        </th>
        <th>
          <abbr title="real account">raccount</abbr>
        </th>
        <th>category</th>
        <th>type</th>
        <th>
          <abbr title="start date">start</abbr>
        </th>
        <th>
          <abbr title="repeat type">rtype</abbr>
        </th>
        <th>cycle</th>
        <th>value</th>
        <th>Daily Rate</th>
        <th>Delete</th>
      </tr>
    </thead>
    <tbody>
      {data.map(transaction => (
        <tr key={transaction.id}>
          <th>{transaction.id}</th>
          <td>{transaction.raccount}</td>
          <td>{transaction.category}</td>
          <td>{transaction.type}</td>
          <td>{transaction.start}</td>
          <td>{transaction.rtype}</td>
          <td>{transaction.cycle}</td>
          <td>{transaction.value}</td>
          <td>{transaction.dailyRate}</td>
          <td onClick={actions.deleteTransaction.bind(this, transaction.id)}>
            X
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const accountTable = (data, actions) => (
  <table className="table is-striped is-hoverable">
    <thead>
      <tr>
        <th>name</th>
        <th>
          <abbr title="starting balance">starting</abbr>
        </th>
        <th>interest</th>
        <th>vehicle</th>
        <th>Delete</th>
      </tr>
    </thead>
    <tbody>
      {data.map(account => (
        <tr key={account.name}>
          <th>{account.name}</th>
          <td>{account.starting}</td>
          <td>{account.interest * 100}%</td>
          <td>{account.vehicle}</td>
          <td onClick={actions.deleteAccount.bind(this, account.name)}>X</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// @flow
import React from 'react'
import { api } from 'neon-js'
import { uniq, pickBy } from 'lodash'

import Loader from '../../Loader'
import asyncWrap from '../../../core/asyncHelper'

type Props = {
  net: NetworkType,
  entries: Array<SendEntryType>
}

type State = {
  addressHasActivity: {
    [address: string]: boolean
  }
}

const withAddressCheck = () => (Component) => {
  return class WithAddressCheckComponent extends React.Component<Props, State> {
    state = {
      addressHasActivity: {}
    }

    componentDidMount () {
      this.getAddresses().forEach(this.checkTransactionHistory)
    }

    render = () => {
      if (this.allAddressesChecked()) {
        return <Component {...this.props} message={this.getMessage()} />
      } else {
        return <Loader />
      }
    }

    checkTransactionHistory = async (address: string) => {
      const { net } = this.props
      const [err, transactions] = await asyncWrap(api.neonDB.getTransactionHistory(net, address))

      const hasActivity = !err && !!transactions && transactions.length > 0

      this.setState({ addressHasActivity: { ...this.state.addressHasActivity, [address]: hasActivity } })
    }

    allAddressesChecked = () => {
      return Object.keys(this.state.addressHasActivity).length === this.getAddresses().length
    }

    getAddresses = () => {
      return uniq(this.props.entries.map((entry) => entry.address))
    }

    getMessage = () => {
      const addresses = Object.keys(pickBy(this.state.addressHasActivity, (hasActivity) => !hasActivity))

      if (addresses.length === 0) {
        return null
      } else {
        return `Warning: the following recipient addresses have no activity in their transaction histories: ${addresses.join(', ')}. Please be sure each address is correct before sending. Note that empty addresses will not appear in blockchain explorers. If an address is empty, please double check that you input the correct address.`
      }
    }
  }
}

export default withAddressCheck
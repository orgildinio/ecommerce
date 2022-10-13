import { PrismaClient } from '@prisma/client'
import { sendPaid } from '../../server.js'
import axios from 'axios'

const prisma = new PrismaClient()

export const getToken = async (req, res) => {
  try {
    const { data } = await axios.post('https://merchant.qpay.mn/v2/auth/token', {}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic VEFQUEFZOlRVUjJoVDQ1',
        Host: 'merchant.qpay.mn',
        'User-Agent': 'insomnia/2022.2.1',
        Cookie: '_4d45d=http://10.233.105.45:3000',
        Accept: '*/*',
        'Content-Length': 0
      }
    })
    const token = await prisma.token.upsert({
      where: {
        id: 1
      },
      update: {
        access_token: data.access_token,
        refresh_token: data.refresh_token
      },
      create: {
        access_token: data.access_token,
        refresh_token: data.refresh_token
      }
    })
    res.status(200).json(data)
  } catch (error) {
    res.status(400).json(error)
  }
}

export const createInvoice = async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({
      data: {
        amount: parseInt(req.body.amount)
      }
    })
    const token = await prisma.token.findUnique({
      where: { id: 1 }
    })
    if (!invoice) {
      res.status(400).json('hadgalj chadsangui')
    }
    const data = {
      invoice_code: 'TAPPAY_INVOICE',
      sender_invoice_no: invoice.id.toString() + 'qpay',
      invoice_receiver_code: 'terminal',
      invoice_description: 'vulcan_analystics',
      amount: req.body.amount,
      callback_url: 'http://vulcan.mn/qpay/' + invoice.id
    }
    const response = await axios.post('https://merchant.qpay.mn/v2/invoice', data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token.access_token,
        Host: 'merchant.qpay.mn',
        'User-Agent': 'insomnia/2021.2.2',
        Cookie: 'qpay_merchant_service.sid=s%3AFVUMTAKoN-wEhO9x5qM_3FRXTMgP41Q4.6kjdtk6%2FrN%2Bot6iQBuVOk6jG8KwyH3q2BhhFNBh1OkQ; _4d45d=http://10.233.76.223:3000'
      }
    })
    if(response.data?.invoice_id) {
      await prisma.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          qpay: response.data.invoice_id
        }
      })
    }
    res.status(200).json({
      id: invoice.id,
      ...response.data
    })
  } catch (error) {
    console.log(error)
    res.status(400).json(error)
  }
}

export const checkInvoice = async (req, res) => {
  try {
    const { id } = req.params
    const token = await prisma.token.findFirst()
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: parseInt(id)
      }
    })

    const invoiceData = {
      object_type: 'INVOICE',
      object_id: invoice.qpay,
      offset: {
        page_number: 1,
        page_limit: 100
      }
    }

    const { data } = await axios.post('https://merchant.qpay.mn/v2/payment/check', invoiceData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token.access_token,
        Host: 'merchant.qpay.mn',
        'User-Agent': 'insomnia/2021.2.2',
        Cookie: 'qpay_merchant_service.sid=s%3AFVUMTAKoN-wEhO9x5qM_3FRXTMgP41Q4.6kjdtk6%2FrN%2Bot6iQBuVOk6jG8KwyH3q2BhhFNBh1OkQ; _4d45d=http://10.233.76.223:3000'
      }
    })

    console.log(data)

    if (data.paid_amount) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          verified: true
        }
      })

      // tulbur tulugdsun uyd app luu medeelel yvuulah function
      sendPaid(true)
    }

    res.status(200).json(data)
  } catch(error) {
    res.status(400).json(error)
  }
}
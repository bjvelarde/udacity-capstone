import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'
import { certToPEM } from '../utils'
const logger = createLogger('auth')
const axios = require('axios');

const jwksUrl = 'https://dev-qrhmhsi4.auth0.com/.well-known/jwks.json'

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    logger.info('User Authorized', jwtToken.sub)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: JwtPayload = decode(token, { complete: true }) as JwtPayload

  logger.info('JWT', jwt)

  const response: any = await axios.get(jwksUrl, {headers: {
                  'Content-Type': 'application/json'
                }})

  var jwks = response.data.keys;

  //logger.info('jwks: ', jwks)

  const signingKeys = jwks
  .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
              && key.kty === 'RSA' // We are only supporting RSA (RS256)
              && key.kid           // The `kid` must be present to be useful for later
              && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
  ).map(key => {
    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
  });

  //logger.info('signingKeys: ', signingKeys)

  const cert = signingKeys[0].publicKey

  logger.info('Cert', cert)

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}


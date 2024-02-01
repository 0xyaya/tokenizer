import * as fs from 'fs';
import * as path from 'path';

import {
    createTree,
    fetchMerkleTree,
    fetchTreeConfigFromSeeds,
    mintV1,
    mplBubblegum
} from '@metaplex-foundation/mpl-bubblegum';
import {
    Context,
    KeypairSigner,
    PublicKey,
    Umi,
    createSignerFromKeypair,
    generateSigner,
    keypairIdentity,
    none,
    publicKey
} from '@metaplex-foundation/umi';
import {createUmi} from '@metaplex-foundation/umi-bundle-defaults';

// import {logger} from './logger';

export class Tokenizer {
    private umi: Umi; //Inject

    constructor() {
        console.log('Tokenizer constructor');
        this.umi = createUmi('https://api.devnet.solana.com');
        const myKeypairSigner = createKeypairSigner(this.umi);
        this.umi.use(keypairIdentity(myKeypairSigner));
        this.umi.use(mplBubblegum());
    }

    generateSigner(): KeypairSigner {
        return generateSigner(this.umi);
    }

    async createTree(merkleTree: KeypairSigner): Promise<KeypairSigner> {
        const builder = await createTree(this.umi, {
            merkleTree,
            maxDepth: 14,
            maxBufferSize: 64
        });

        const tx = await builder.sendAndConfirm(this.umi);

        console.log('Create Tree Tx: ', tx.signature);

        return merkleTree;
    }

    async mint(leafOwner: PublicKey, merkleTree: PublicKey) {
        const tx2 = await mintV1(this.umi, {
            leafOwner,
            merkleTree,
            metadata: {
                name: 'My Compressed NFT',
                uri: 'https://example.com/my-cnft.json',
                sellerFeeBasisPoints: 500, // 5%
                collection: none(),
                creators: [
                    {
                        address: this.umi.identity.publicKey,
                        verified: false,
                        share: 100
                    }
                ]
            }
        }).sendAndConfirm(this.umi);

        console.log('Mint Tx: ', tx2.signature);
    }
}

const createKeypairSigner = (umi: Context) => {
    const WALLET_PATH = path.join(
        process.env['HOME']!,
        '.config/solana/id.json'
    );
    const myKeypair = umi.eddsa.createKeypairFromSecretKey(
        Buffer.from(
            JSON.parse(fs.readFileSync(WALLET_PATH, {encoding: 'utf-8'}))
        )
    );
    return createSignerFromKeypair(umi, myKeypair);
};

// const tokenizer = new Tokenizer();
// const leafOwner = tokenizer.generateSigner();
// console.log('LeafOwner signer: ', leafOwner.publicKey.toString());
// const merkleTree = tokenizer.generateSigner();
// console.log('MerkleTree signer: ', merkleTree.publicKey.toString());
// // tokenizer.createTree(merkleTree);
// tokenizer.mint(
//     leafOwner.publicKey,
//     publicKey('BmPfS6wHvrUy6enEpwiLMSTpWL9WUES8NAzPo8rkhcqL')
// );

// eslint-disable-next-line import/no-unresolved
import { create } from 'kubo-rpc-client';
// TODO fix import lint issue

const add = async ({ content, ipfsNode, ipfsGateway }) => {
  try {
    const ipfs = create({ url: ipfsNode });
    const uploadResult = await ipfs.add(content);
    const { cid } = uploadResult;
    const multiaddr = `ipfs/${cid.toString()}`;
    const publicUrl = `${ipfsGateway}/${multiaddr}`;
    await fetch(publicUrl, { method: 'HEAD' }).then((res) => {
      if (!res.ok) {
        throw Error(`Failed to load uploaded file at ${publicUrl}`);
      }
    });
    return cid.toString();
  } catch (e) {
    throw Error(e);
  }
};

export { add };

FROM alpine:3.9.4

RUN apk --no-cache add bash
RUN apk --no-cache add openssl

COPY decryptDataset.sh .
RUN chmod +x decryptDataset.sh

ENTRYPOINT ["./decryptDataset.sh"]

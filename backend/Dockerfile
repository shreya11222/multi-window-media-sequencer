FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -o server .

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache sqlite-libs
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]

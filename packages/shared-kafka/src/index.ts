import { Kafka, Producer, Consumer, KafkaConfig, Partitioners } from 'kafkajs';

export class KafkaBrokerClient {
  private kafka: Kafka;
  private producerInstance?: Producer;

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka(config);
  }

  async getProducer(): Promise<Producer> {
    if (!this.producerInstance) {
      // Explicitly declaration of the LegacyPartitioner prevents log warnings
      // and guarantees consistent key-to-partition hashing strategies
      this.producerInstance = this.kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner,
      });
      await this.producerInstance.connect();
    }
    return this.producerInstance;
  }

  async createConsumer(groupId: string): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    return consumer;
  }

  async disconnect(): Promise<void> {
    if (this.producerInstance) {
      await this.producerInstance.disconnect();
    }
  }
}

import { PageOptionsDto } from '../../../common/dto/page-options.dto.ts';
import { NotificationChannelType } from '../../../constants/notification-channel-type.ts';
import { Order } from '../../../constants/order.ts';
import { BooleanFieldOptional, EnumFieldOptional } from '../../../decorators/field.decorators.ts';

export class NotificationMessagesPageOptionsDto extends PageOptionsDto {
  // Newest-first reads better for a notification inbox than PageOptionsDto's ASC default.
  @EnumFieldOptional(() => Order, { default: Order.DESC })
  readonly order: Order = Order.DESC;

  @EnumFieldOptional(() => NotificationChannelType)
  readonly channel?: NotificationChannelType;

  @BooleanFieldOptional()
  readonly isRead?: boolean;
}

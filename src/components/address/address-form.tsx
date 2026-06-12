'use client';

import {useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useLocale} from '@/contexts/locale-context';
import {Address} from '@/types/user';
import {useToast} from '@/hooks/use-toast';
import {MapPin, X} from 'lucide-react';
import {ADDRESS_LIMITS, AddressFormValues, composeFullAddress, createAddressSchema} from '@/lib/validation/address-schema';

interface AddressFormProps {
    /**
     * Persists the validated values. The form owns nothing beyond collection +
     * validation — the parent decides create vs update and any side effects, then
     * resolves on success or throws on failure (the form surfaces a toast).
     */
    onSubmit: (values: AddressFormValues) => Promise<void>;
    onCancel: () => void;
    /** Prefills fields for edit mode. */
    initialValue?: Partial<Address>;
    /** Show the "set as default" checkbox (checkout flow). */
    showDefaultToggle?: boolean;
    /** Show the composed-address preview block (checkout flow). */
    showPreview?: boolean;
    /** Switches the header/submit copy to the edit variant. */
    isEditing?: boolean;
}

export function AddressForm({
    onSubmit,
    onCancel,
    initialValue,
    showDefaultToggle = false,
    showPreview = false,
    isEditing = false,
}: AddressFormProps) {
    const {t} = useLocale();
    const {toast} = useToast();
    const [loading, setLoading] = useState(false);

    // Rebuilt per render so validation messages re-localize on language switch.
    const schema = useMemo(() => createAddressSchema(t), [t]);

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
        defaultValues: {
            title: initialValue?.title ?? '',
            addressType: initialValue?.addressType ?? 'HOME',
            street: initialValue?.street ?? '',
            city: initialValue?.city ?? '',
            state: initialValue?.state ?? '',
            postalCode: initialValue?.postalCode ?? '',
            country: initialValue?.country ?? '',
            isDefault: initialValue?.isDefault ?? false,
        },
    });

    const handleSubmit = async (values: AddressFormValues) => {
        setLoading(true);
        try {
            await onSubmit(values);
        } catch (error) {
            console.error('Failed to save address:', error);
            toast({
                title: t('common', 'error'),
                description: t('address', 'failedToAdd'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Live preview mirrors the backend's fullAddress composition.
    const watched = form.watch();
    const previewText = showPreview ? composeFullAddress(watched) : '';

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5"/>
                    <span>{isEditing ? t('address', 'editAddress') : t('address', 'addNewAddress')}</span>
                </CardTitle>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('address', 'addressTitle')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('address', 'titlePlaceholder')}
                                            autoComplete="off"
                                            maxLength={ADDRESS_LIMITS.title}
                                            disabled={loading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="addressType"
                            render={({field, fieldState}) => (
                                <FormItem>
                                    <FormLabel>{t('address', 'addressType')}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                                        <FormControl>
                                            <SelectTrigger aria-invalid={!!fieldState.error}>
                                                <SelectValue placeholder={t('address', 'selectAddressType')}/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="HOME">{t('address', 'home')}</SelectItem>
                                            <SelectItem value="WORK">{t('address', 'work')}</SelectItem>
                                            <SelectItem value="OTHER">{t('address', 'other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="street"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('address', 'street')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('address', 'streetPlaceholder')}
                                            autoComplete="address-line1"
                                            maxLength={ADDRESS_LIMITS.street}
                                            disabled={loading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('address', 'city')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('address', 'cityPlaceholder')}
                                                autoComplete="address-level2"
                                                maxLength={ADDRESS_LIMITS.city}
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('address', 'state')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('address', 'statePlaceholder')}
                                                autoComplete="address-level1"
                                                maxLength={ADDRESS_LIMITS.state}
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('address', 'postalCode')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('address', 'postalCodePlaceholder')}
                                                autoComplete="postal-code"
                                                inputMode="numeric"
                                                maxLength={10}
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="country"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('address', 'country')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('address', 'countryPlaceholder')}
                                                autoComplete="country-name"
                                                maxLength={ADDRESS_LIMITS.country}
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {showDefaultToggle && (
                            <FormField
                                control={form.control}
                                name="isDefault"
                                render={({field}) => (
                                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                            {t('address', 'setAsDefault')}
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        )}

                        {showPreview && previewText && (
                            <div className="p-3 bg-muted rounded-md overflow-hidden">
                                <p className="text-xs text-muted-foreground">{t('address', 'addressPreview')}</p>
                                {/* break long unbroken strings so the preview can't overflow its box */}
                                <p className="text-sm text-foreground mt-1 [overflow-wrap:anywhere]">{previewText}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            <X className="w-4 h-4 mr-2"/>
                            {t('common', 'cancel')}
                        </Button>
                        <Button type="submit" disabled={loading || !form.formState.isValid}>
                            {loading
                                ? t('common', 'processing')
                                : isEditing
                                    ? t('address', 'saveChanges')
                                    : t('address', 'saveAddress')}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

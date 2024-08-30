/* prettier-ignore */
export const enum ParseError {
    config__fixed_index_collision = 0x01f,

    message__not_array = 0x01f,
    message__no_header = 0x02f,
    message__header_not_array = 0x03f,
    message__length_less_than_2 = 0x07f,
    message__header_empty = 0x0af,
    message__header_version_not_string = 0x0bf,
    header__no_key_list = 0x10f,
    header__key_list_not_array = 0x11f,
    header__key_not_string = 0x12f,
    header__key_unknown_format = 0x13f,
    header__key_duplicate = 0x14f,
    header__no_encoding_map = 0x20f,
    header__encoding_map_not_object = 0x21f,
    header__encoding_map_key_not_reference = 0x24f,
    header__encoding_map_value_not_string = 0x25f,
    header__encoding_map_value_not_index = 0x20f,
    header__encoding_map_key_out_of_bounds = 0x2af,
    header__encoding_map_index_out_of_bounds = 0x2bf,
    header__encoding_map_index_reserved = 0x2cf,
    header__no_metadata = 0x30f,
    header__metadata_not_object = 0x31f,
    header__metadata_key_not_reference = 0x36f,
    header__metadata_key_out_of_bounds = 0x3af,

    header__no_root_reference = 0x40f,
    header__root_reference_not_integer = 0x41f,
    header__root_reference_out_of_bounds = 0x40f,
    header__extra_elements = 0x50f,
    input__unknown_string = 0x10F,
    input__invalid_type = 0x11F,
}
